/**
 * AgentScope SDK — TypeScript client for the AgentScopeModule
 *
 * Provides a clean API for both humans (policy management) and agents
 * (scoped execution + proof of permissions).
 *
 * @author clio_ghost
 */

import {
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  encodeFunctionData,
  decodeFunctionResult,
  parseAbi,
  formatEther,
  getAddress,
} from "viem";

// ═══════════════════════════════════════════════════════
//  ABI (minimal — only what the SDK needs)
// ═══════════════════════════════════════════════════════

const AGENT_SCOPE_ABI = parseAbi([
  // Owner functions (called through Safe)
  "function setAgentPolicy(address agent, uint256 dailySpendLimitWei, uint256 maxPerTxWei, uint256 sessionExpiry, address[] allowedContracts, bytes4[] allowedFunctions)",
  "function setPaused(bool paused)",
  "function setTokenAllowance(address agent, address token, uint256 dailyAllowance)",
  "function revokeAgent(address agent)",

  // Agent functions
  "function executeAsAgent(address to, uint256 value, bytes data) returns (bool)",

  // View functions
  "function getAgentScope(address agent) view returns (bool active, uint256 dailySpendLimitWei, uint256 maxPerTxWei, uint256 sessionExpiry, uint256 remainingBudget, address[] allowedContracts, bytes4[] allowedFunctions)",
  "function paused() view returns (bool)",
  "function checkPermission(address agent, address to, uint256 value, bytes data) view returns (bool allowed, string reason)",
  "function safe() view returns (address)",
  "function tokenAllowances(address agent, address token) view returns (uint256)",
  "function tokenSpent(address agent, address token) view returns (uint256)",

  // Events
  "event AgentPolicySet(address indexed agent, uint256 dailyLimit, uint256 maxPerTx, uint256 expiry)",
  "event GlobalPause(bool paused)",
  "event AgentExecuted(address indexed agent, address indexed to, uint256 value, bytes4 selector)",
  "event AgentRevoked(address indexed agent)",
  "event PolicyViolation(address indexed agent, string reason)",
  "event TokenAllowanceSet(address indexed agent, address indexed token, uint256 dailyAllowance)",
]);

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface AgentPolicy {
  active: boolean;
  dailySpendLimitWei: bigint;
  maxPerTxWei: bigint;
  sessionExpiry: bigint;
  remainingBudget: bigint;
  allowedContracts: Address[];
  allowedFunctions: Hex[];
}

export interface PolicyConfig {
  dailySpendLimit: bigint;           // Wei
  maxPerTx?: bigint;                 // Wei per transaction (0 = no per-tx limit)
  sessionExpiry?: number;            // Unix timestamp (0 = no expiry)
  allowedContracts?: Address[];      // Empty = any
  allowedFunctions?: Hex[];          // Empty = any (bytes4 selectors)
}

export interface TokenAllowanceConfig {
  token: Address;
  dailyAllowance: bigint;           // Token units (with decimals)
}

export interface PermissionCheck {
  allowed: boolean;
  reason: string;
}

export interface ExecutionResult {
  hash: Hash;
  success: boolean;
}

export interface AgentScopeConfig {
  moduleAddress: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

// ═══════════════════════════════════════════════════════
//  AGENT SCOPE CLIENT
// ═══════════════════════════════════════════════════════

export class AgentScope {
  readonly moduleAddress: Address;
  readonly publicClient: PublicClient;
  private walletClient?: WalletClient;

  constructor(config: AgentScopeConfig) {
    this.moduleAddress = getAddress(config.moduleAddress);
    this.publicClient = config.publicClient;
    this.walletClient = config.walletClient;
  }

  // ─── VIEW FUNCTIONS ───────────────────────────────

  /**
   * Get an agent's current scope and remaining budget
   */
  async getScope(agent: Address): Promise<AgentPolicy> {
    const data = await this.publicClient.readContract({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      functionName: "getAgentScope",
      args: [getAddress(agent)],
    });

    const [active, dailySpendLimitWei, maxPerTxWei, sessionExpiry, remainingBudget, allowedContracts, allowedFunctions] = data as [boolean, bigint, bigint, bigint, bigint, Address[], Hex[]];

    return {
      active,
      dailySpendLimitWei,
      maxPerTxWei,
      sessionExpiry,
      remainingBudget,
      allowedContracts,
      allowedFunctions,
    };
  }

  /**
   * Pre-flight check — will this transaction be allowed?
   */
  async checkPermission(
    agent: Address,
    to: Address,
    value: bigint = 0n,
    data: Hex = "0x"
  ): Promise<PermissionCheck> {
    const result = await this.publicClient.readContract({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      functionName: "checkPermission",
      args: [getAddress(agent), getAddress(to), value, data],
    });

    const [allowed, reason] = result as [boolean, string];
    return { allowed, reason };
  }

  /**
   * Get the Safe address this module is attached to
   */
  async getSafe(): Promise<Address> {
    return (await this.publicClient.readContract({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      functionName: "safe",
    })) as Address;
  }

  /**
   * Get remaining token allowance for an agent
   */
  async getTokenAllowance(agent: Address, token: Address): Promise<{ allowance: bigint; spent: bigint }> {
    const [allowance, spent] = await Promise.all([
      this.publicClient.readContract({
        address: this.moduleAddress,
        abi: AGENT_SCOPE_ABI,
        functionName: "tokenAllowances",
        args: [getAddress(agent), getAddress(token)],
      }),
      this.publicClient.readContract({
        address: this.moduleAddress,
        abi: AGENT_SCOPE_ABI,
        functionName: "tokenSpent",
        args: [getAddress(agent), getAddress(token)],
      }),
    ]);

    return {
      allowance: allowance as bigint,
      spent: spent as bigint,
    };
  }

  /**
   * Human-readable summary of an agent's scope
   */
  async describeScopeHuman(agent: Address): Promise<string> {
    const scope = await this.getScope(agent);

    if (!scope.active) return `Agent ${agent}: INACTIVE (no permissions)`;

    const lines: string[] = [
      `Agent ${agent}: ACTIVE`,
      `  Daily ETH limit: ${formatEther(scope.dailySpendLimitWei)} ETH`,
      `  Per-tx limit:    ${scope.maxPerTxWei > 0n ? formatEther(scope.maxPerTxWei) + " ETH" : "none"}`,
      `  Remaining today: ${formatEther(scope.remainingBudget)} ETH`,
    ];

    if (scope.sessionExpiry > 0n) {
      const expiryDate = new Date(Number(scope.sessionExpiry) * 1000);
      const isExpired = expiryDate < new Date();
      lines.push(`  Session expiry:  ${expiryDate.toISOString()} ${isExpired ? "(EXPIRED)" : ""}`);
    } else {
      lines.push(`  Session expiry:  none (permanent)`);
    }

    if (scope.allowedContracts.length > 0) {
      lines.push(`  Allowed contracts: ${scope.allowedContracts.join(", ")}`);
    } else {
      lines.push(`  Allowed contracts: any`);
    }

    if (scope.allowedFunctions.length > 0) {
      lines.push(`  Allowed functions: ${scope.allowedFunctions.join(", ")}`);
    } else {
      lines.push(`  Allowed functions: any`);
    }

    return lines.join("\n");
  }

  // ─── AGENT EXECUTION ─────────────────────────────

  /**
   * Execute a transaction through the Safe as an authorized agent.
   * Pre-flight checks are run automatically.
   */
  async execute(
    to: Address,
    value: bigint = 0n,
    data: Hex = "0x"
  ): Promise<ExecutionResult> {
    this.requireWallet();

    // Pre-flight check
    const agentAddress = this.walletClient!.account!.address;
    const check = await this.checkPermission(agentAddress, to, value, data);
    if (!check.allowed) {
      throw new AgentScopeError(`Pre-flight failed: ${check.reason}`, check.reason);
    }

    const hash = await this.walletClient!.writeContract({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      functionName: "executeAsAgent",
      args: [getAddress(to), value, data],
    });

    return { hash, success: true };
  }

  /**
   * Execute with retry — if the tx fails, check why and report
   */
  async executeWithDiagnostics(
    to: Address,
    value: bigint = 0n,
    data: Hex = "0x"
  ): Promise<ExecutionResult & { diagnostics?: string }> {
    try {
      return await this.execute(to, value, data);
    } catch (err: any) {
      const agentAddress = this.walletClient!.account!.address;
      const scope = await this.getScope(agentAddress);
      const check = await this.checkPermission(agentAddress, to, value, data);

      const diagnostics = [
        `Execution failed: ${err.message}`,
        `Agent active: ${scope.active}`,
        `Remaining budget: ${formatEther(scope.remainingBudget)} ETH`,
        `Permission check: ${check.allowed ? "PASS" : `FAIL (${check.reason})`}`,
        scope.sessionExpiry > 0n
          ? `Session expires: ${new Date(Number(scope.sessionExpiry) * 1000).toISOString()}`
          : `Session: permanent`,
      ].join("\n");

      throw new AgentScopeError(diagnostics, check.reason, err);
    }
  }

  // ─── POLICY MANAGEMENT (for Safe owners) ──────────

  /**
   * Encode a setAgentPolicy call for execution through the Safe.
   * Returns the calldata — caller submits it via their Safe's execTransaction.
   */
  encodePolicyUpdate(agent: Address, config: PolicyConfig): Hex {
    return encodeFunctionData({
      abi: AGENT_SCOPE_ABI,
      functionName: "setAgentPolicy",
      args: [
        getAddress(agent),
        config.dailySpendLimit,
        config.maxPerTx ?? 0n,
        BigInt(config.sessionExpiry ?? 0),
        config.allowedContracts ?? [],
        config.allowedFunctions ?? [],
      ],
    });
  }

  /**
   * Encode a setTokenAllowance call for execution through the Safe.
   */
  encodeTokenAllowance(agent: Address, config: TokenAllowanceConfig): Hex {
    return encodeFunctionData({
      abi: AGENT_SCOPE_ABI,
      functionName: "setTokenAllowance",
      args: [getAddress(agent), getAddress(config.token), config.dailyAllowance],
    });
  }

  /**
   * Encode a setPaused call — emergency kill switch for ALL agents.
   */
  encodePause(paused: boolean): Hex {
    return encodeFunctionData({
      abi: AGENT_SCOPE_ABI,
      functionName: "setPaused",
      args: [paused],
    });
  }

  /**
   * Check if the module is globally paused
   */
  async isPaused(): Promise<boolean> {
    return (await this.publicClient.readContract({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      functionName: "paused",
    })) as boolean;
  }

  /**
   * Encode a revokeAgent call for execution through the Safe.
   */
  encodeRevoke(agent: Address): Hex {
    return encodeFunctionData({
      abi: AGENT_SCOPE_ABI,
      functionName: "revokeAgent",
      args: [getAddress(agent)],
    });
  }

  // ─── AGENT-TO-AGENT TRUST ─────────────────────────

  /**
   * Verify another agent's scope on-chain.
   * Returns null if the agent isn't active.
   */
  async verifyAgent(agent: Address): Promise<AgentPolicy | null> {
    const scope = await this.getScope(agent);
    if (!scope.active) return null;

    // Check if session is expired
    if (scope.sessionExpiry > 0n) {
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now > scope.sessionExpiry) return null;
    }

    return scope;
  }

  /**
   * Check if an agent can afford a specific transaction.
   * Useful for agent-to-agent negotiation.
   */
  async canAfford(agent: Address, value: bigint): Promise<boolean> {
    const scope = await this.getScope(agent);
    return scope.active && scope.remainingBudget >= value;
  }

  // ─── EVENT WATCHING ───────────────────────────────

  /**
   * Watch for agent executions
   */
  watchExecutions(callback: (event: { agent: Address; to: Address; value: bigint; selector: Hex }) => void) {
    return this.publicClient.watchContractEvent({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      eventName: "AgentExecuted",
      onLogs: (logs) => {
        for (const log of logs) {
          const args = log.args as any;
          callback({
            agent: args.agent,
            to: args.to,
            value: args.value,
            selector: args.selector,
          });
        }
      },
    });
  }

  /**
   * Watch for policy violations (agent tried something outside scope)
   */
  watchViolations(callback: (event: { agent: Address; reason: string }) => void) {
    return this.publicClient.watchContractEvent({
      address: this.moduleAddress,
      abi: AGENT_SCOPE_ABI,
      eventName: "PolicyViolation",
      onLogs: (logs) => {
        for (const log of logs) {
          const args = log.args as any;
          callback({ agent: args.agent, reason: args.reason });
        }
      },
    });
  }

  // ─── HELPERS ──────────────────────────────────────

  private requireWallet(): asserts this is { walletClient: WalletClient } {
    if (!this.walletClient?.account) {
      throw new AgentScopeError("WalletClient with account required for execution", "no_wallet");
    }
  }
}

// ═══════════════════════════════════════════════════════
//  ERRORS
// ═══════════════════════════════════════════════════════

export class AgentScopeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "AgentScopeError";
  }
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

export { AGENT_SCOPE_ABI };
export default AgentScope;
