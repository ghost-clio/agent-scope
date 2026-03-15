/**
 * AgentScope — Tweet to Policy Demo
 *
 * Shows the full pipeline:
 *   Tweet (natural language) → Parsed Policy → Compiled Calldata → Deployed → Agent Operating
 *
 * This is the "paste a tweet and your agent abides by it" flow.
 *
 * Run: node demo/tweet-to-policy-demo.cjs
 *
 * @author clio_ghost
 */

// ═══════════════════════════════════════════════════════
//  SIMULATED POLICY COMPILER (mirrors policy/compiler.ts)
//  (Using plain JS for demo portability — no TS compilation needed)
// ═══════════════════════════════════════════════════════

const { parseEther, formatEther } = require("ethers");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── Known contracts for NL resolution ──
const KNOWN_CONTRACTS = {
  uniswap: { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", name: "Uniswap V3 Router" },
  aave: { address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", name: "Aave V3 Pool" },
  "1inch": { address: "0x1111111254EEB25477B68fb85Ed929f73A960582", name: "1inch Router" },
};

const KNOWN_FUNCTIONS = {
  swap: { selector: "0x38ed1739", name: "swapExactTokensForTokens" },
  transfer: { selector: "0xa9059cbb", name: "transfer" },
  approve: { selector: "0x095ea7b3", name: "approve" },
  deposit: { selector: "0xd0e30db0", name: "deposit" },
  withdraw: { selector: "0x2e1a7d4d", name: "withdraw" },
};

const KNOWN_TOKENS = {
  USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  DAI: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
};

// ═══════════════════════════════════════════════════════
//  NATURAL LANGUAGE PARSER
// ═══════════════════════════════════════════════════════

function parseNaturalLanguage(input, agentAddress, walletAddress) {
  const lower = input.toLowerCase();
  const policy = {
    version: "1.0.0",
    meta: {
      name: "Policy from tweet",
      description: input,
      source: "natural-language",
      created: new Date().toISOString(),
    },
    agent: { address: agentAddress },
    scope: {
      chains: ["ethereum"],
      wallet: { type: "safe", address: walletAddress },
    },
    permissions: {},
  };

  // ── Parse native ETH limits ──
  const dailyMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*day|\/day|daily)/i);
  if (dailyMatch) {
    policy.permissions.spending = policy.permissions.spending || {};
    policy.permissions.spending.native = {
      dailyLimit: `${dailyMatch[1]} ETH`,
      windowType: "fixed-24h",
    };

    const perTxMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*(?:tx|transaction)|\/tx|max\s*per)/i);
    if (perTxMatch) {
      policy.permissions.spending.native.perTransaction = `${perTxMatch[1]} ETH`;
    }
  }

  // ── Parse token limits ──
  const tokenMatches = lower.matchAll(/([\d,.]+)\s*(usdc|usdt|dai)\s*(?:per\s*day|\/day|daily)/gi);
  for (const match of tokenMatches) {
    policy.permissions.spending = policy.permissions.spending || {};
    policy.permissions.spending.tokens = policy.permissions.spending.tokens || [];
    const symbol = match[2].toUpperCase();
    const info = KNOWN_TOKENS[symbol];
    if (info) {
      policy.permissions.spending.tokens.push({
        address: info.address,
        symbol,
        dailyLimit: match[1].replace(/,/g, ""),
        decimals: info.decimals,
      });
    }
  }

  // ── Parse contract restrictions ──
  const onlyMatch = lower.match(/(?:only|just|restricted to|whitelist)\s+([\w\s,&]+?)(?:\.|,\s*(?:only|max|no|expires|[\d.])|$)/i);
  if (onlyMatch) {
    const names = onlyMatch[1].split(/[,&]|\band\b/).map(n => n.trim().toLowerCase()).filter(Boolean);
    const allowed = [];
    const functions = [];

    for (const name of names) {
      // Check if it's a contract name
      if (KNOWN_CONTRACTS[name]) {
        allowed.push({ address: KNOWN_CONTRACTS[name].address, name: KNOWN_CONTRACTS[name].name });
      }
      // Check if it's a function name
      if (KNOWN_FUNCTIONS[name]) {
        functions.push({ selector: KNOWN_FUNCTIONS[name].selector, name: KNOWN_FUNCTIONS[name].name });
      }
    }

    if (allowed.length > 0) {
      policy.permissions.contracts = {
        mode: "whitelist",
        allowed: allowed.map(c => ({
          ...c,
          functions: functions.length > 0 ? functions : undefined,
        })),
      };
    }
  }

  // ── Parse "only swap()" style ──
  const fnOnlyMatch = lower.match(/only\s+(swap|transfer|approve|deposit|withdraw)(?:\(\))?/i);
  if (fnOnlyMatch && !policy.permissions.contracts) {
    const fn = KNOWN_FUNCTIONS[fnOnlyMatch[1].toLowerCase()];
    if (fn) {
      // Add function restriction to existing contracts or create new
      if (policy.permissions.contracts?.allowed) {
        policy.permissions.contracts.allowed.forEach(c => {
          c.functions = [{ selector: fn.selector, name: fn.name }];
        });
      }
    }
  }

  // ── Parse "no approve" ──
  if (/no\s+approve/i.test(lower)) {
    policy.permissions._noApprove = true;
  }

  // ── Parse expiry ──
  const hoursMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*h/i);
  if (hoursMatch) {
    const ms = parseInt(hoursMatch[1]) * 3600000;
    policy.permissions.temporal = { sessionExpiry: new Date(Date.now() + ms).toISOString() };
  }
  const daysMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*d/i);
  if (daysMatch) {
    const ms = parseInt(daysMatch[1]) * 86400000;
    policy.permissions.temporal = { sessionExpiry: new Date(Date.now() + ms).toISOString() };
  }

  return policy;
}

// ═══════════════════════════════════════════════════════
//  POLICY SUMMARY
// ═══════════════════════════════════════════════════════

function summarize(policy) {
  const lines = [];

  lines.push(`${BOLD}Agent:${RESET}    ${policy.agent.address}`);
  lines.push(`${BOLD}Wallet:${RESET}   ${policy.scope.wallet.type.toUpperCase()} ${policy.scope.wallet.address}`);
  lines.push(`${BOLD}Chains:${RESET}   ${policy.scope.chains.join(", ")}`);
  lines.push("");

  const spending = policy.permissions.spending;
  if (spending) {
    lines.push(`${BOLD}SPENDING LIMITS:${RESET}`);
    if (spending.native) {
      let limit = `  • Up to ${GREEN}${spending.native.dailyLimit}${RESET} per day`;
      if (spending.native.perTransaction) {
        limit += ` (${spending.native.perTransaction} max per tx)`;
      }
      lines.push(limit);
    }
    if (spending.tokens) {
      for (const t of spending.tokens) {
        lines.push(`  • Up to ${GREEN}${t.dailyLimit} ${t.symbol}${RESET} per day`);
      }
    }
    lines.push("");
  }

  const contracts = policy.permissions.contracts;
  if (contracts?.allowed?.length > 0) {
    lines.push(`${BOLD}ALLOWED CONTRACTS:${RESET}`);
    for (const c of contracts.allowed) {
      let line = `  • ${c.name || c.address}`;
      if (c.functions?.length > 0) {
        line += ` — ${c.functions.map(f => f.name).join(", ")} only`;
      }
      lines.push(line);
    }
    lines.push(`  • ${RED}No other contracts permitted${RESET}`);
    lines.push("");
  }

  if (policy.permissions.temporal?.sessionExpiry) {
    lines.push(`${BOLD}EXPIRY:${RESET}`);
    lines.push(`  • ${new Date(policy.permissions.temporal.sessionExpiry).toLocaleString()}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════
//  COMPILE TO CALLDATA
// ═══════════════════════════════════════════════════════

function compileToParams(policy) {
  const spending = policy.permissions.spending;

  let dailyLimitWei = 0n;
  let maxPerTxWei = 0n;
  let sessionExpiry = 0;

  if (spending?.native) {
    const match = spending.native.dailyLimit.match(/([\d.]+)/);
    if (match) dailyLimitWei = parseEther(match[1]);

    if (spending.native.perTransaction) {
      const ptxMatch = spending.native.perTransaction.match(/([\d.]+)/);
      if (ptxMatch) maxPerTxWei = parseEther(ptxMatch[1]);
    }
  }

  if (policy.permissions.temporal?.sessionExpiry) {
    sessionExpiry = Math.floor(new Date(policy.permissions.temporal.sessionExpiry).getTime() / 1000);
  }

  const allowedContracts = (policy.permissions.contracts?.allowed || []).map(c => c.address);
  const allowedFunctions = [];
  for (const c of policy.permissions.contracts?.allowed || []) {
    for (const f of c.functions || []) {
      if (!allowedFunctions.includes(f.selector)) {
        allowedFunctions.push(f.selector);
      }
    }
  }

  return {
    dailyLimitWei,
    maxPerTxWei,
    sessionExpiry,
    allowedContracts,
    allowedFunctions,
  };
}

// ═══════════════════════════════════════════════════════
//  DEMO
// ═══════════════════════════════════════════════════════

async function main() {
  console.log();
  console.log(`${BOLD}${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   AgentScope — TWEET TO POLICY DEMO                  ║${RESET}`);
  console.log(`${BOLD}${CYAN}║                                                       ║${RESET}`);
  console.log(`${BOLD}${CYAN}║   Natural language → Policy → On-chain → Enforced     ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  // ── Example tweets/descriptions ──
  const examples = [
    {
      source: "Tweet by @alice_builder",
      text: "Just set up my trading agent with AgentScope: 0.5 ETH per day, 0.1 ETH per tx, only Uniswap, only swap(), expires in 24h",
    },
    {
      source: "Slack message from treasury manager",
      text: "Need a payroll agent: 1000 USDC daily, no approve, expires in 7d",
    },
    {
      source: "Discord DM to OpenClaw",
      text: "Set my agent to 0.05 ETH per day, 0.001 ETH per tx. Any contract is fine. Expires in 3d",
    },
  ];

  const agentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const safeAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];

    console.log(`${BOLD}${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}  Example ${i + 1}: ${example.source}${RESET}`);
    console.log(`${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log();

    // Step 1: Show the input
    console.log(`${BOLD}📝 INPUT (natural language):${RESET}`);
    console.log(`${DIM}  "${example.text}"${RESET}`);
    console.log();

    // Step 2: Parse to policy
    console.log(`${BOLD}⚙️  STEP 1: Parse → Policy Document${RESET}`);
    const policy = parseNaturalLanguage(example.text, agentAddress, safeAddress);
    console.log(`${DIM}  ${JSON.stringify(policy.permissions, null, 2).split("\n").join("\n  ")}${RESET}`);
    console.log();

    // Step 3: Validate
    console.log(`${BOLD}✅ STEP 2: Validate${RESET}`);
    const warnings = [];
    if (!policy.permissions.spending?.native && !policy.permissions.spending?.tokens) {
      warnings.push("No spending limits defined");
    }
    if (!policy.permissions.contracts) {
      warnings.push("No contract restrictions — agent can interact with any contract");
    }
    if (!policy.permissions.temporal?.sessionExpiry) {
      warnings.push("No session expiry — permissions are permanent");
    }
    if (warnings.length > 0) {
      warnings.forEach(w => console.log(`  ${YELLOW}⚠️  ${w}${RESET}`));
    } else {
      console.log(`  ${GREEN}✓ All checks passed${RESET}`);
    }
    console.log();

    // Step 4: Human-readable summary
    console.log(`${BOLD}📋 STEP 3: Human-Readable Summary${RESET}`);
    console.log(summarize(policy).split("\n").map(l => "  " + l).join("\n"));
    console.log();

    // Step 5: Compile to on-chain params
    console.log(`${BOLD}🔗 STEP 4: Compile → On-Chain Parameters${RESET}`);
    const params = compileToParams(policy);
    console.log(`  ${DIM}dailySpendLimitWei:  ${params.dailyLimitWei.toString()} (${formatEther(params.dailyLimitWei)} ETH)${RESET}`);
    console.log(`  ${DIM}maxPerTxWei:         ${params.maxPerTxWei.toString()} (${formatEther(params.maxPerTxWei)} ETH)${RESET}`);
    console.log(`  ${DIM}sessionExpiry:       ${params.sessionExpiry} (${params.sessionExpiry ? new Date(params.sessionExpiry * 1000).toLocaleString() : "never"})${RESET}`);
    console.log(`  ${DIM}allowedContracts:    [${params.allowedContracts.join(", ")}]${RESET}`);
    console.log(`  ${DIM}allowedFunctions:    [${params.allowedFunctions.join(", ")}]${RESET}`);
    console.log();

    // Step 6: Show the flow
    console.log(`${BOLD}🚀 STEP 5: Ready to Deploy${RESET}`);
    console.log(`  ${GREEN}→ Call setAgentPolicy() on Safe with compiled parameters${RESET}`);
    console.log(`  ${GREEN}→ Agent loads policy and self-enforces (Layer 2)${RESET}`);
    console.log(`  ${GREEN}→ On-chain module enforces limits (Layer 1)${RESET}`);
    console.log();
  }

  // ── Summary ──
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  THE FLOW:                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}                                                       ${RESET}`);
  console.log(`${BOLD}${CYAN}  "0.5 ETH/day, only Uniswap, swap only, 24h"         ${RESET}`);
  console.log(`${BOLD}${CYAN}           │                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}           ▼                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}  ┌─── NL Parser ───┐                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  │  PolicyDocument  │                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  └────────┬─────────┘                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}           ▼                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}  ┌─── Compiler ─────┐                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  │   On-chain args   │                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  └────────┬──────────┘                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}           ▼                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}  ┌─── Safe Tx ───────┐                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  │  setAgentPolicy() │                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  └────────┬──────────┘                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}           ▼                                            ${RESET}`);
  console.log(`${BOLD}${CYAN}  ┌─── Agent Runs ────┐                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  │  Within bounds ✅  │                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}  └───────────────────┘                                  ${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  console.log();
  console.log(`  ${DIM}Paste a tweet. Get a policy. Deploy it. Done.${RESET}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
