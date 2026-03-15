/**
 * AgentScope Policy Compiler
 *
 * Converts between three representations:
 *   1. Natural language → Policy JSON
 *   2. Policy JSON → On-chain calldata (EVM)
 *   3. Policy JSON → Human-readable summary
 *
 * The natural language parser handles common patterns:
 *   "0.5 ETH per day, only Uniswap, only swap()"
 *   "max 100 USDC daily, no approvals, expires tomorrow"
 *
 * @author clio_ghost
 */

import {
  type Address,
  type Hex,
  encodeFunctionData,
  parseEther,
  parseUnits,
  parseAbi,
  toFunctionSelector,
} from "viem";

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface PolicyDocument {
  version: "1.0.0";
  meta?: {
    name?: string;
    description?: string;
    author?: string;
    created?: string;
    template?: string;
  };
  agent: {
    address: string;
    identity?: {
      ens?: string;
      erc8004?: string;
    };
  };
  scope: {
    chains: string[];
    wallet: {
      type: "safe" | "eoa" | "multisig" | "program";
      address: string;
      moduleAddress?: string;
    };
  };
  permissions: {
    spending?: {
      native?: {
        dailyLimit: string;       // "0.5 ETH"
        perTransaction?: string;  // "0.1 ETH"
        windowType?: "fixed-24h" | "rolling-24h";
      };
      tokens?: Array<{
        address: string;
        symbol?: string;
        dailyLimit: string;
        decimals?: number;
      }>;
    };
    contracts?: {
      mode: "whitelist" | "blacklist" | "any";
      allowed?: Array<{
        address: string;
        name?: string;
        functions?: Array<{
          selector: string;
          name?: string;
          humanDescription?: string;
        }>;
      }>;
    };
    temporal?: {
      sessionExpiry?: string;
      activeHours?: {
        timezone: string;
        windows: Array<{
          start: string;
          end: string;
          days?: string[];
        }>;
      };
      cooldown?: {
        afterViolation?: string;
        afterLargeTransaction?: string;
        largeTransactionThreshold?: string;
      };
    };
  };
  escalation?: {
    onViolation?: string;
    onLargeTransaction?: string;
    onNewContract?: string;
    notificationChannels?: Array<{
      type: string;
      url?: string;
      chatId?: string;
      address?: string;
    }>;
  };
  delegation?: {
    canDelegate?: boolean;
    maxDelegationDepth?: number;
    delegationBudgetFraction?: number;
  };
}

export interface CompiledPolicy {
  // On-chain parameters
  dailySpendLimitWei: bigint;
  maxPerTxWei: bigint;
  sessionExpiry: number;
  allowedContracts: Address[];
  allowedFunctions: Hex[];
  tokenAllowances: Array<{
    token: Address;
    dailyAllowance: bigint;
  }>;
  // Encoded calldata for Safe execution
  setAgentPolicyCalldata: Hex;
  tokenAllowanceCalldatas: Hex[];
}

// ═══════════════════════════════════════════════════════
//  ABI
// ═══════════════════════════════════════════════════════

const MODULE_ABI = parseAbi([
  "function setAgentPolicy(address agent, uint256 dailySpendLimitWei, uint256 maxPerTxWei, uint256 sessionExpiry, address[] allowedContracts, bytes4[] allowedFunctions)",
  "function setTokenAllowance(address agent, address token, uint256 dailyAllowance)",
]);

// ═══════════════════════════════════════════════════════
//  WELL-KNOWN CONTRACTS & SELECTORS
// ═══════════════════════════════════════════════════════

const KNOWN_CONTRACTS: Record<string, { address: string; name: string; chain: string }> = {
  "uniswap": { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", name: "Uniswap V3 Router", chain: "ethereum" },
  "uniswap-v3": { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", name: "Uniswap V3 Router", chain: "ethereum" },
  "aave": { address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", name: "Aave V3 Pool", chain: "ethereum" },
  "1inch": { address: "0x1111111254EEB25477B68fb85Ed929f73A960582", name: "1inch Router", chain: "ethereum" },
};

const KNOWN_FUNCTIONS: Record<string, { selector: Hex; name: string }> = {
  "swap": { selector: "0x38ed1739", name: "swapExactTokensForTokens" },
  "transfer": { selector: "0xa9059cbb", name: "transfer" },
  "approve": { selector: "0x095ea7b3", name: "approve" },
  "deposit": { selector: "0xd0e30db0", name: "deposit" },
  "withdraw": { selector: "0x2e1a7d4d", name: "withdraw" },
  "supply": { selector: "0x617ba037", name: "supply" },
  "borrow": { selector: "0xa415bcad", name: "borrow" },
  "repay": { selector: "0x573ade81", name: "repay" },
  "mint": { selector: "0xa0712d68", name: "mint" },
};

// ═══════════════════════════════════════════════════════
//  NATURAL LANGUAGE PARSER
// ═══════════════════════════════════════════════════════

/**
 * Parse natural language policy descriptions into a PolicyDocument.
 *
 * Handles patterns like:
 *   "0.5 ETH per day, only Uniswap, only swap(), expires in 24h"
 *   "max 100 USDC daily, no approvals"
 *   "1 ETH/day, 0.1 ETH per tx, whitelist Aave and Uniswap"
 */
export function parseNaturalLanguage(
  input: string,
  agentAddress: string,
  walletAddress: string,
  moduleAddress?: string,
): PolicyDocument {
  const lower = input.toLowerCase().trim();

  // Parse native spending limits
  const native = parseNativeLimit(lower);

  // Parse token limits
  const tokens = parseTokenLimits(lower);

  // Parse contract restrictions
  const contracts = parseContractRestrictions(lower);

  // Parse function restrictions
  const functions = parseFunctionRestrictions(lower);

  // Parse expiry
  const expiry = parseExpiry(lower);

  // Build policy document
  const policy: PolicyDocument = {
    version: "1.0.0",
    meta: {
      name: "Policy from natural language",
      description: input,
      created: new Date().toISOString(),
    },
    agent: { address: agentAddress },
    scope: {
      chains: ["ethereum"],
      wallet: {
        type: "safe",
        address: walletAddress,
        ...(moduleAddress ? { moduleAddress } : {}),
      },
    },
    permissions: {},
  };

  // Add spending
  if (native || tokens.length > 0) {
    policy.permissions.spending = {};
    if (native) policy.permissions.spending.native = native;
    if (tokens.length > 0) policy.permissions.spending.tokens = tokens;
  }

  // Add contracts
  if (contracts.length > 0) {
    const contractEntries = contracts.map((c) => {
      const fnFilters = functions.filter((f) => !f._contractSpecific || f._contractName === c.name?.toLowerCase());
      return {
        address: c.address,
        name: c.name,
        ...(fnFilters.length > 0
          ? { functions: fnFilters.map((f) => ({ selector: f.selector, name: f.name })) }
          : {}),
      };
    });

    policy.permissions.contracts = {
      mode: "whitelist",
      allowed: contractEntries,
    };
  } else if (functions.length > 0) {
    // Functions specified without specific contracts
    policy.permissions.contracts = {
      mode: "any",
      allowed: [],
    };
  }

  // Add temporal
  if (expiry) {
    policy.permissions.temporal = { sessionExpiry: expiry };
  }

  return policy;
}

function parseNativeLimit(input: string): PolicyDocument["permissions"]["spending"]["native"] | null {
  // Match patterns like "0.5 ETH per day", "1 ETH/day", "0.5 eth daily"
  const dailyMatch = input.match(/([\d.]+)\s*eth\s*(?:per\s*day|\/day|daily|\/d)/i);
  if (!dailyMatch) return null;

  const result: any = {
    dailyLimit: `${dailyMatch[1]} ETH`,
    windowType: "fixed-24h" as const,
  };

  // Match per-tx limit: "0.1 ETH per tx", "0.1 ETH/tx", "max 0.1 ETH per transaction"
  const perTxMatch = input.match(/([\d.]+)\s*eth\s*(?:per\s*(?:tx|transaction)|\/tx|max\s*per\s*(?:tx|transaction))/i);
  if (perTxMatch) {
    result.perTransaction = `${perTxMatch[1]} ETH`;
  }

  return result;
}

function parseTokenLimits(input: string): Array<{ address: string; symbol: string; dailyLimit: string; decimals: number }> {
  const tokens: Array<{ address: string; symbol: string; dailyLimit: string; decimals: number }> = [];

  // Match "100 USDC per day", "500 USDC daily", "1000 USDT/day"
  const tokenMatch = input.matchAll(/([\d,.]+)\s*(usdc|usdt|dai|weth|wbtc)\s*(?:per\s*day|\/day|daily|\/d)/gi);
  for (const match of tokenMatch) {
    const amount = match[1].replace(/,/g, "");
    const symbol = match[2].toUpperCase();
    const tokenInfo = getTokenInfo(symbol);
    tokens.push({
      address: tokenInfo.address,
      symbol,
      dailyLimit: amount,
      decimals: tokenInfo.decimals,
    });
  }

  return tokens;
}

function parseContractRestrictions(input: string): Array<{ address: string; name?: string }> {
  const contracts: Array<{ address: string; name?: string }> = [];

  // Match "only Uniswap", "whitelist Aave", "allowed: Uniswap, Aave"
  const onlyMatch = input.match(/(?:only|whitelist|allowed[:\s]+)\s*([\w\s,]+?)(?:\.|,\s*(?:only|max|no|expires|0x)|$)/i);
  if (onlyMatch) {
    const names = onlyMatch[1].split(/[,&]/).map((n) => n.trim().toLowerCase()).filter(Boolean);
    for (const name of names) {
      const known = KNOWN_CONTRACTS[name];
      if (known) {
        contracts.push({ address: known.address, name: known.name });
      }
    }
  }

  // Match explicit addresses: "only 0x1234..."
  const addrMatch = input.matchAll(/(?:only|whitelist|allowed)\s*(0x[a-fA-F0-9]{40})/gi);
  for (const match of addrMatch) {
    contracts.push({ address: match[1] });
  }

  return contracts;
}

function parseFunctionRestrictions(input: string): Array<{ selector: Hex; name: string; _contractSpecific?: boolean; _contractName?: string }> {
  const functions: Array<{ selector: Hex; name: string; _contractSpecific?: boolean; _contractName?: string }> = [];

  // Match "only swap()", "swap only", "allowed: swap, transfer"
  const fnMatch = input.match(/(?:only|allowed[:\s]+)\s*((?:swap|transfer|approve|deposit|withdraw|supply|borrow|repay|mint)(?:\(\))?(?:\s*(?:,|and)\s*(?:swap|transfer|approve|deposit|withdraw|supply|borrow|repay|mint)(?:\(\))?)*)/i);
  if (fnMatch) {
    const names = fnMatch[1].split(/[,&]|\band\b/).map((n) => n.trim().toLowerCase().replace(/[()]/g, "")).filter(Boolean);
    for (const name of names) {
      const known = KNOWN_FUNCTIONS[name];
      if (known) {
        functions.push({ selector: known.selector, name: known.name });
      }
    }
  }

  // Match "no approve", "block approve()", "deny approve"
  // (These get handled at enforcement level, not in the whitelist — log a warning)
  const noMatch = input.match(/(?:no|block|deny)\s+(approve|transfer|mint)(?:\(\))?/gi);
  if (noMatch && functions.length === 0) {
    // If "no approve" is the only restriction, add everything EXCEPT approve
    const blocked = new Set(
      Array.from(input.matchAll(/(?:no|block|deny)\s+(\w+)/gi)).map((m) => m[1].toLowerCase())
    );
    for (const [name, fn] of Object.entries(KNOWN_FUNCTIONS)) {
      if (!blocked.has(name)) {
        functions.push({ selector: fn.selector, name: fn.name });
      }
    }
  }

  return functions;
}

function parseExpiry(input: string): string | null {
  // "expires in 24h", "expires in 1 day", "expires tomorrow"
  const hoursMatch = input.match(/expires?\s+in\s+(\d+)\s*h(?:ours?)?/i);
  if (hoursMatch) {
    const ms = parseInt(hoursMatch[1]) * 60 * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  }

  const daysMatch = input.match(/expires?\s+in\s+(\d+)\s*d(?:ays?)?/i);
  if (daysMatch) {
    const ms = parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  }

  if (/expires?\s+tomorrow/i.test(input)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow.toISOString();
  }

  // ISO date
  const isoMatch = input.match(/expires?\s+(20\d{2}-\d{2}-\d{2}(?:T[\d:]+Z?)?)/i);
  if (isoMatch) return new Date(isoMatch[1]).toISOString();

  return null;
}

function getTokenInfo(symbol: string): { address: string; decimals: number } {
  const tokens: Record<string, { address: string; decimals: number }> = {
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    DAI: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    WETH: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    WBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  };
  return tokens[symbol] || { address: "0x0000000000000000000000000000000000000000", decimals: 18 };
}

// ═══════════════════════════════════════════════════════
//  POLICY COMPILER (JSON → On-Chain Calldata)
// ═══════════════════════════════════════════════════════

/**
 * Compile a PolicyDocument into EVM calldata for the AgentScopeModule.
 */
export function compile(policy: PolicyDocument): CompiledPolicy {
  const spending = policy.permissions.spending;

  // Parse native limits
  let dailySpendLimitWei = 0n;
  let maxPerTxWei = 0n;

  if (spending?.native) {
    dailySpendLimitWei = parseAmountToWei(spending.native.dailyLimit);
    if (spending.native.perTransaction) {
      maxPerTxWei = parseAmountToWei(spending.native.perTransaction);
    }
  }

  // Parse session expiry
  let sessionExpiry = 0;
  if (policy.permissions.temporal?.sessionExpiry) {
    sessionExpiry = Math.floor(new Date(policy.permissions.temporal.sessionExpiry).getTime() / 1000);
  }

  // Collect allowed contracts
  const allowedContracts: Address[] = [];
  if (policy.permissions.contracts?.mode === "whitelist" && policy.permissions.contracts.allowed) {
    for (const contract of policy.permissions.contracts.allowed) {
      allowedContracts.push(contract.address as Address);
    }
  }

  // Collect allowed functions
  const allowedFunctions: Hex[] = [];
  if (policy.permissions.contracts?.allowed) {
    for (const contract of policy.permissions.contracts.allowed) {
      if (contract.functions) {
        for (const fn of contract.functions) {
          const sel = fn.selector as Hex;
          if (!allowedFunctions.includes(sel)) {
            allowedFunctions.push(sel);
          }
        }
      }
    }
  }

  // Token allowances
  const tokenAllowances: Array<{ token: Address; dailyAllowance: bigint }> = [];
  if (spending?.tokens) {
    for (const token of spending.tokens) {
      const decimals = token.decimals ?? 18;
      tokenAllowances.push({
        token: token.address as Address,
        dailyAllowance: parseUnits(token.dailyLimit, decimals),
      });
    }
  }

  // Encode setAgentPolicy calldata
  const setAgentPolicyCalldata = encodeFunctionData({
    abi: MODULE_ABI,
    functionName: "setAgentPolicy",
    args: [
      policy.agent.address as Address,
      dailySpendLimitWei,
      maxPerTxWei,
      BigInt(sessionExpiry),
      allowedContracts,
      allowedFunctions as `0x${string}`[],
    ],
  });

  // Encode token allowance calldatas
  const tokenAllowanceCalldatas: Hex[] = tokenAllowances.map((ta) =>
    encodeFunctionData({
      abi: MODULE_ABI,
      functionName: "setTokenAllowance",
      args: [policy.agent.address as Address, ta.token, ta.dailyAllowance],
    })
  );

  return {
    dailySpendLimitWei,
    maxPerTxWei,
    sessionExpiry,
    allowedContracts,
    allowedFunctions,
    tokenAllowances,
    setAgentPolicyCalldata,
    tokenAllowanceCalldatas,
  };
}

function parseAmountToWei(amount: string): bigint {
  const match = amount.match(/([\d.]+)\s*(eth|gwei|wei)?/i);
  if (!match) throw new Error(`Cannot parse amount: ${amount}`);

  const value = match[1];
  const unit = (match[2] || "eth").toLowerCase();

  switch (unit) {
    case "eth":
      return parseEther(value);
    case "gwei":
      return parseUnits(value, 9);
    case "wei":
      return BigInt(value);
    default:
      return parseEther(value);
  }
}

// ═══════════════════════════════════════════════════════
//  HUMAN-READABLE SUMMARY
// ═══════════════════════════════════════════════════════

/**
 * Generate a human-readable summary of a policy.
 * This is what gets displayed to users and what agents can read to understand their own constraints.
 */
export function summarize(policy: PolicyDocument): string {
  const lines: string[] = [];

  // Header
  if (policy.meta?.name) {
    lines.push(`📋 ${policy.meta.name}`);
  }

  lines.push(`Agent: ${policy.agent.identity?.ens || policy.agent.address}`);
  lines.push(`Wallet: ${policy.scope.wallet.type.toUpperCase()} ${policy.scope.wallet.address}`);
  lines.push(`Chains: ${policy.scope.chains.join(", ")}`);
  lines.push("");

  // Spending
  const spending = policy.permissions.spending;
  if (spending) {
    lines.push("SPENDING LIMITS:");
    if (spending.native) {
      let limit = `• Up to ${spending.native.dailyLimit} per day`;
      if (spending.native.perTransaction) {
        limit += ` (${spending.native.perTransaction} max per transaction)`;
      }
      lines.push(limit);
    }
    if (spending.tokens) {
      for (const token of spending.tokens) {
        lines.push(`• Up to ${token.dailyLimit} ${token.symbol || "tokens"} per day`);
      }
    }
    lines.push("");
  }

  // Contracts
  const contracts = policy.permissions.contracts;
  if (contracts) {
    lines.push("ALLOWED ACTIONS:");
    if (contracts.mode === "any") {
      lines.push("• Any contract (no restrictions)");
    } else if (contracts.allowed && contracts.allowed.length > 0) {
      for (const c of contracts.allowed) {
        let line = `• ${c.name || c.address}`;
        if (c.functions && c.functions.length > 0) {
          const fnNames = c.functions.map((f) => f.name || f.selector).join(", ");
          line += ` — ${fnNames} only`;
        }
        lines.push(line);
      }
      lines.push("• No other contracts permitted");
    }
    lines.push("");
  }

  // Temporal
  const temporal = policy.permissions.temporal;
  if (temporal) {
    lines.push("TIME RESTRICTIONS:");
    if (temporal.sessionExpiry) {
      const expiry = new Date(temporal.sessionExpiry);
      lines.push(`• Session expires: ${expiry.toLocaleString()}`);
    }
    if (temporal.activeHours) {
      for (const window of temporal.activeHours.windows) {
        const days = window.days ? window.days.join(", ") : "every day";
        lines.push(`• Active ${days}, ${window.start}–${window.end} ${temporal.activeHours.timezone}`);
      }
    }
    if (temporal.cooldown) {
      if (temporal.cooldown.afterViolation) {
        lines.push(`• Cooldown after violation: ${temporal.cooldown.afterViolation}`);
      }
    }
    lines.push("");
  }

  // Escalation
  if (policy.escalation) {
    lines.push("WHEN BLOCKED:");
    if (policy.escalation.onViolation) {
      lines.push(`• Violation → ${formatEscalation(policy.escalation.onViolation)}`);
    }
    if (policy.escalation.onNewContract) {
      lines.push(`• New contract → ${formatEscalation(policy.escalation.onNewContract)}`);
    }
    lines.push("");
  }

  // Delegation
  if (policy.delegation?.canDelegate) {
    lines.push("DELEGATION:");
    lines.push(`• Can delegate up to ${(policy.delegation.delegationBudgetFraction || 0) * 100}% of budget`);
    lines.push(`• Max delegation depth: ${policy.delegation.maxDelegationDepth || 1}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

function formatEscalation(action: string): string {
  const map: Record<string, string> = {
    "block-and-notify": "freeze agent, notify owner",
    "block-silent": "freeze agent silently",
    "warn-and-allow": "warn owner, allow transaction",
    "notify-only": "notify owner (no block)",
    "block-and-request-approval": "freeze agent, request owner approval",
    notify: "notify owner",
    allow: "allow (no action)",
  };
  return map[action] || action;
}

// ═══════════════════════════════════════════════════════
//  AGENT SYSTEM PROMPT GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a system prompt fragment that an AI agent can use to understand its own constraints.
 * This is designed to be injected into the agent's context/system prompt.
 */
export function toAgentPrompt(policy: PolicyDocument): string {
  const summary = summarize(policy);

  return `## Your Wallet Permissions (AgentScope Policy)

You are operating under an AgentScope policy. These are hard constraints enforced both by you (pre-flight) and on-chain (hard wall). Even if you attempt to exceed these limits, the on-chain module will revert the transaction.

${summary}

### Rules:
1. NEVER attempt a transaction that violates your policy. Check your limits BEFORE acting.
2. If you're unsure whether an action is allowed, call checkPermission() first.
3. If a transaction is blocked, report the reason to your operator. Do not retry.
4. Track your spending mentally — you have a daily budget that resets every 24 hours.
5. If your session has expired, you CANNOT transact. Request a policy renewal from your operator.

### Pre-flight checklist (before every transaction):
- [ ] Is the target contract in my whitelist? (or is whitelist disabled?)
- [ ] Is the function selector in my allowed list? (or is function list disabled?)
- [ ] Is the ETH value within my per-transaction limit?
- [ ] Do I have enough remaining daily budget?
- [ ] Has my session expired?
- [ ] Am I within any token-specific limits?

If ANY check fails, DO NOT submit the transaction.`;
}

// ═══════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a policy document for correctness and safety.
 */
export function validate(policy: PolicyDocument): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (policy.version !== "1.0.0") {
    errors.push(`Unsupported version: ${policy.version}`);
  }

  if (!policy.agent?.address) {
    errors.push("Agent address is required");
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(policy.agent.address)) {
    errors.push(`Invalid agent address: ${policy.agent.address}`);
  }

  if (!policy.scope?.wallet?.address) {
    errors.push("Wallet address is required");
  }

  if (!policy.scope?.chains || policy.scope.chains.length === 0) {
    errors.push("At least one chain must be specified");
  }

  // Spending sanity checks
  const spending = policy.permissions.spending;
  if (spending?.native) {
    const daily = parseAmountToWei(spending.native.dailyLimit);
    if (daily === 0n) {
      warnings.push("Daily limit is 0 — agent cannot spend any ETH");
    }
    if (spending.native.perTransaction) {
      const perTx = parseAmountToWei(spending.native.perTransaction);
      if (perTx > daily) {
        warnings.push("Per-transaction limit exceeds daily limit — per-tx limit will be the effective cap");
      }
    }
    if (daily > parseEther("100")) {
      warnings.push("Daily limit exceeds 100 ETH — is this intentional?");
    }
  }

  // Contract whitelist checks
  if (policy.permissions.contracts?.mode === "whitelist") {
    if (!policy.permissions.contracts.allowed || policy.permissions.contracts.allowed.length === 0) {
      warnings.push("Whitelist mode with no contracts — agent cannot interact with any contracts");
    }
  }

  if (!policy.permissions.contracts || policy.permissions.contracts.mode === "any") {
    warnings.push("No contract restrictions — agent can interact with ANY contract");
  }

  // Temporal checks
  if (policy.permissions.temporal?.sessionExpiry) {
    const expiry = new Date(policy.permissions.temporal.sessionExpiry);
    if (expiry < new Date()) {
      errors.push("Session expiry is in the past");
    }
    if (expiry.getTime() - Date.now() > 365 * 24 * 60 * 60 * 1000) {
      warnings.push("Session expiry is more than 1 year away — consider a shorter duration");
    }
  } else {
    warnings.push("No session expiry — permissions are permanent until revoked");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════════

export const TEMPLATES: Record<string, Partial<PolicyDocument["permissions"]>> = {
  "defi-trader-conservative": {
    spending: {
      native: { dailyLimit: "0.5 ETH", perTransaction: "0.1 ETH", windowType: "fixed-24h" },
      tokens: [
        { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", dailyLimit: "500", decimals: 6 },
      ],
    },
    contracts: {
      mode: "whitelist",
      allowed: [
        {
          address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
          name: "Uniswap V3 Router",
          functions: [{ selector: "0x38ed1739", name: "swapExactTokensForTokens" }],
        },
      ],
    },
  },
  "defi-trader-aggressive": {
    spending: {
      native: { dailyLimit: "5 ETH", perTransaction: "2 ETH", windowType: "fixed-24h" },
      tokens: [
        { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", dailyLimit: "10000", decimals: 6 },
        { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", dailyLimit: "10000", decimals: 6 },
      ],
    },
    contracts: { mode: "any" },
  },
  "payroll-agent": {
    spending: {
      native: { dailyLimit: "0.01 ETH", windowType: "fixed-24h" },
      tokens: [
        { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", dailyLimit: "50000", decimals: 6 },
      ],
    },
    contracts: {
      mode: "whitelist",
      allowed: [],
    },
  },
  "social-tipper": {
    spending: {
      native: { dailyLimit: "0.05 ETH", perTransaction: "0.001 ETH", windowType: "fixed-24h" },
    },
    contracts: { mode: "any" },
  },
  "data-oracle": {
    spending: {
      native: { dailyLimit: "0.01 ETH", perTransaction: "0.005 ETH", windowType: "fixed-24h" },
    },
    contracts: { mode: "any" },
  },
};

/**
 * Create a policy from a template name.
 */
export function fromTemplate(
  templateName: string,
  agentAddress: string,
  walletAddress: string,
  overrides?: Partial<PolicyDocument["permissions"]>
): PolicyDocument {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}. Available: ${Object.keys(TEMPLATES).join(", ")}`);
  }

  return {
    version: "1.0.0",
    meta: {
      name: `${templateName} policy`,
      template: templateName,
      created: new Date().toISOString(),
    },
    agent: { address: agentAddress },
    scope: {
      chains: ["ethereum"],
      wallet: { type: "safe", address: walletAddress },
    },
    permissions: {
      ...template,
      ...overrides,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

export default {
  parseNaturalLanguage,
  compile,
  summarize,
  toAgentPrompt,
  validate,
  fromTemplate,
  TEMPLATES,
};
