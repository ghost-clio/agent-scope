/**
 * AgentScope Middleware — Agent-Side Policy Enforcement
 *
 * Wraps any AI agent's transaction pipeline with automatic policy awareness.
 * The agent loads its policy, understands its constraints, and self-enforces
 * BEFORE submitting transactions on-chain.
 *
 * Two enforcement layers:
 *   1. Middleware (this) — pre-flight checks, spending tracking, natural language awareness
 *   2. On-chain module — hard wall, reverts if policy violated
 *
 * The middleware is a UX optimization (no wasted gas, better agent reasoning).
 * The on-chain module is the security guarantee (cannot be bypassed).
 *
 * @author clio_ghost
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  formatEther,
  parseEther,
  parseUnits,
  getAddress,
} from "viem";

import type { AgentScope } from "./index";

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface PolicyDocument {
  version: "1.0.0";
  meta?: { name?: string; description?: string };
  agent: { address: string };
  scope: {
    chains: string[];
    wallet: { type: string; address: string; moduleAddress?: string };
  };
  permissions: {
    spending?: {
      native?: {
        dailyLimit: string;
        perTransaction?: string;
        windowType?: string;
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
    notificationChannels?: Array<{
      type: string;
      url?: string;
      chatId?: string;
    }>;
  };
}

export interface TransactionIntent {
  to: Address;
  value?: bigint;
  data?: Hex;
  description?: string;   // Human-readable intent for logging
}

export interface PreFlightResult {
  allowed: boolean;
  reason?: string;
  warnings: string[];
  remainingBudget: {
    native: bigint;
    tokens: Record<string, bigint>;
  };
  onChainVerified?: boolean;
}

export interface MiddlewareConfig {
  policy: PolicyDocument;
  agentScope: AgentScope;           // SDK client for on-chain checks
  agentAddress: Address;
  onViolation?: (intent: TransactionIntent, reason: string) => void | Promise<void>;
  onExecution?: (intent: TransactionIntent, txHash: string) => void | Promise<void>;
  onWarning?: (intent: TransactionIntent, warnings: string[]) => void | Promise<void>;
  enableOnChainPreFlight?: boolean; // Default: true. Set false for gas savings on trusted agents.
  enableNotifications?: boolean;    // Default: true.
}

// ═══════════════════════════════════════════════════════
//  SPENDING TRACKER
// ═══════════════════════════════════════════════════════

class SpendingTracker {
  private nativeSpent: bigint = 0n;
  private tokenSpent: Map<string, bigint> = new Map();
  private windowStart: number = Date.now();
  private readonly windowDuration = 24 * 60 * 60 * 1000; // 24h in ms

  constructor(
    private dailyNativeLimit: bigint,
    private perTxNativeLimit: bigint,
    private tokenLimits: Map<string, { dailyLimit: bigint; decimals: number }>,
  ) {}

  resetIfNeeded(): void {
    if (Date.now() - this.windowStart >= this.windowDuration) {
      this.nativeSpent = 0n;
      this.tokenSpent.clear();
      this.windowStart = Date.now();
    }
  }

  checkNative(value: bigint): { allowed: boolean; reason?: string } {
    this.resetIfNeeded();

    if (this.perTxNativeLimit > 0n && value > this.perTxNativeLimit) {
      return {
        allowed: false,
        reason: `Per-transaction limit exceeded: ${formatEther(value)} ETH > ${formatEther(this.perTxNativeLimit)} ETH max`,
      };
    }

    const remaining = this.dailyNativeLimit - this.nativeSpent;
    if (value > remaining) {
      return {
        allowed: false,
        reason: `Daily limit exceeded: ${formatEther(value)} ETH requested, ${formatEther(remaining)} ETH remaining`,
      };
    }

    return { allowed: true };
  }

  checkToken(token: string, amount: bigint): { allowed: boolean; reason?: string } {
    this.resetIfNeeded();

    const limit = this.tokenLimits.get(token.toLowerCase());
    if (!limit) return { allowed: true }; // No limit set = unrestricted

    const spent = this.tokenSpent.get(token.toLowerCase()) || 0n;
    const remaining = limit.dailyLimit - spent;

    if (amount > remaining) {
      return {
        allowed: false,
        reason: `Token daily limit exceeded: ${amount} requested, ${remaining} remaining`,
      };
    }

    return { allowed: true };
  }

  recordNativeSpend(value: bigint): void {
    this.nativeSpent += value;
  }

  recordTokenSpend(token: string, amount: bigint): void {
    const current = this.tokenSpent.get(token.toLowerCase()) || 0n;
    this.tokenSpent.set(token.toLowerCase(), current + amount);
  }

  getRemainingNative(): bigint {
    this.resetIfNeeded();
    return this.dailyNativeLimit - this.nativeSpent;
  }

  getRemainingToken(token: string): bigint {
    this.resetIfNeeded();
    const limit = this.tokenLimits.get(token.toLowerCase());
    if (!limit) return BigInt(Number.MAX_SAFE_INTEGER);
    const spent = this.tokenSpent.get(token.toLowerCase()) || 0n;
    return limit.dailyLimit - spent;
  }

  /**
   * Sync local tracking with on-chain state.
   * Call this on initialization and periodically.
   */
  syncFromChain(nativeSpent: bigint, tokenSpends: Map<string, bigint>): void {
    this.nativeSpent = nativeSpent;
    this.tokenSpent = new Map(tokenSpends);
  }
}

// ═══════════════════════════════════════════════════════
//  MIDDLEWARE
// ═══════════════════════════════════════════════════════

export class AgentScopeMiddleware {
  private policy: PolicyDocument;
  private agentScope: AgentScope;
  private agentAddress: Address;
  private tracker: SpendingTracker;
  private contractWhitelist: Set<string>;
  private functionWhitelist: Set<string>;
  private whitelistEnabled: boolean;
  private functionWhitelistEnabled: boolean;
  private sessionExpiry: Date | null;
  private config: MiddlewareConfig;
  private violationCount: number = 0;
  private lastViolation: Date | null = null;
  private executionLog: Array<{
    timestamp: Date;
    intent: TransactionIntent;
    result: "allowed" | "blocked";
    reason?: string;
  }> = [];

  constructor(config: MiddlewareConfig) {
    this.config = config;
    this.policy = config.policy;
    this.agentScope = config.agentScope;
    this.agentAddress = getAddress(config.agentAddress);

    // Parse spending limits
    const spending = config.policy.permissions.spending;
    const dailyLimit = spending?.native?.dailyLimit
      ? parseAmountToWei(spending.native.dailyLimit)
      : 0n;
    const perTxLimit = spending?.native?.perTransaction
      ? parseAmountToWei(spending.native.perTransaction)
      : 0n;

    // Parse token limits
    const tokenLimits = new Map<string, { dailyLimit: bigint; decimals: number }>();
    if (spending?.tokens) {
      for (const t of spending.tokens) {
        const decimals = t.decimals ?? 18;
        tokenLimits.set(t.address.toLowerCase(), {
          dailyLimit: parseUnits(t.dailyLimit, decimals),
          decimals,
        });
      }
    }

    this.tracker = new SpendingTracker(dailyLimit, perTxLimit, tokenLimits);

    // Parse contract whitelist
    this.contractWhitelist = new Set();
    this.whitelistEnabled = false;
    this.functionWhitelist = new Set();
    this.functionWhitelistEnabled = false;

    const contracts = config.policy.permissions.contracts;
    if (contracts?.mode === "whitelist" && contracts.allowed) {
      this.whitelistEnabled = true;
      for (const c of contracts.allowed) {
        this.contractWhitelist.add(c.address.toLowerCase());
        if (c.functions) {
          this.functionWhitelistEnabled = true;
          for (const fn of c.functions) {
            this.functionWhitelist.add(fn.selector.toLowerCase());
          }
        }
      }
    }

    // Parse session expiry
    this.sessionExpiry = config.policy.permissions.temporal?.sessionExpiry
      ? new Date(config.policy.permissions.temporal.sessionExpiry)
      : null;
  }

  // ─── PRE-FLIGHT CHECK ─────────────────────────────

  /**
   * Check whether a transaction would be allowed under the current policy.
   * Runs local checks first (fast, free), then optionally verifies on-chain.
   */
  async preFlight(intent: TransactionIntent): Promise<PreFlightResult> {
    const warnings: string[] = [];
    const value = intent.value ?? 0n;
    const data = intent.data ?? "0x";

    // Check 1: Session expiry
    if (this.sessionExpiry && new Date() > this.sessionExpiry) {
      return this.blocked(intent, "Session expired — request policy renewal from operator", warnings);
    }

    // Check 2: Cooldown after violation
    if (this.lastViolation && this.policy.permissions.temporal?.cooldown?.afterViolation) {
      const cooldownMs = parseDuration(this.policy.permissions.temporal.cooldown.afterViolation);
      if (Date.now() - this.lastViolation.getTime() < cooldownMs) {
        return this.blocked(intent, `In cooldown after violation (${this.policy.permissions.temporal.cooldown.afterViolation})`, warnings);
      }
    }

    // Check 3: Contract whitelist
    if (this.whitelistEnabled) {
      if (!this.contractWhitelist.has(intent.to.toLowerCase())) {
        return this.blocked(intent, `Contract ${intent.to} not in whitelist`, warnings);
      }
    }

    // Check 4: Function whitelist
    if (this.functionWhitelistEnabled && data.length >= 10) {
      const selector = data.slice(0, 10).toLowerCase();
      if (!this.functionWhitelist.has(selector)) {
        return this.blocked(intent, `Function ${selector} not in allowed list`, warnings);
      }
    }

    // Check 5: Native spending limit
    if (value > 0n) {
      const nativeCheck = this.tracker.checkNative(value);
      if (!nativeCheck.allowed) {
        return this.blocked(intent, nativeCheck.reason!, warnings);
      }

      // Warning for large transactions
      const threshold = this.policy.permissions.temporal?.cooldown?.largeTransactionThreshold;
      if (threshold && value >= parseAmountToWei(threshold)) {
        warnings.push(`Large transaction: ${formatEther(value)} ETH`);
      }
    }

    // Check 6: Token spending (parse ERC20 calls)
    if (data.length >= 74) {
      const selector = data.slice(0, 10).toLowerCase();
      // transfer or approve
      if (selector === "0xa9059cbb" || selector === "0x095ea7b3") {
        const amount = BigInt("0x" + data.slice(74, 138));
        const tokenCheck = this.tracker.checkToken(intent.to, amount);
        if (!tokenCheck.allowed) {
          return this.blocked(intent, tokenCheck.reason!, warnings);
        }
      }
    }

    // Check 7: Active hours
    if (this.policy.permissions.temporal?.activeHours) {
      const inWindow = this.checkActiveHours();
      if (!inWindow) {
        return this.blocked(intent, "Outside active hours", warnings);
      }
    }

    // Check 8: On-chain verification (optional but recommended)
    let onChainVerified = false;
    if (this.config.enableOnChainPreFlight !== false) {
      try {
        const check = await this.agentScope.checkPermission(this.agentAddress, intent.to, value, data as Hex);
        if (!check.allowed) {
          return this.blocked(intent, `On-chain check failed: ${check.reason}`, warnings);
        }
        onChainVerified = true;
      } catch (err) {
        return this.blocked(intent, "On-chain pre-flight check failed — blocking transaction (fail closed)", warnings);
      }
    }

    // All checks passed
    const remainingBudget = {
      native: this.tracker.getRemainingNative(),
      tokens: {} as Record<string, bigint>,
    };

    if (this.config.onWarning && warnings.length > 0) {
      await this.config.onWarning(intent, warnings);
    }

    this.executionLog.push({
      timestamp: new Date(),
      intent,
      result: "allowed",
    });

    return {
      allowed: true,
      warnings,
      remainingBudget,
      onChainVerified,
    };
  }

  // ─── EXECUTE WITH ENFORCEMENT ─────────────────────

  /**
   * Execute a transaction with full middleware enforcement.
   * Pre-flight → execute → record spending → report.
   */
  async execute(intent: TransactionIntent): Promise<{
    success: boolean;
    txHash?: string;
    preFlight: PreFlightResult;
  }> {
    // Pre-flight
    const check = await this.preFlight(intent);
    if (!check.allowed) {
      return { success: false, preFlight: check };
    }

    // Execute through AgentScope SDK
    try {
      const result = await this.agentScope.execute(
        intent.to,
        intent.value ?? 0n,
        (intent.data ?? "0x") as Hex,
      );

      // Record spending
      if (intent.value && intent.value > 0n) {
        this.tracker.recordNativeSpend(intent.value);
      }

      // Record token spending
      if (intent.data && intent.data.length >= 74) {
        const selector = intent.data.slice(0, 10).toLowerCase();
        if (selector === "0xa9059cbb" || selector === "0x095ea7b3") {
          const amount = BigInt("0x" + intent.data.slice(74, 138));
          this.tracker.recordTokenSpend(intent.to, amount);
        }
      }

      if (this.config.onExecution) {
        await this.config.onExecution(intent, result.hash);
      }

      return { success: true, txHash: result.hash, preFlight: check };
    } catch (err: any) {
      return {
        success: false,
        preFlight: {
          ...check,
          allowed: false,
          reason: `Execution failed: ${err.message}`,
        },
      };
    }
  }

  // ─── STATUS & INTROSPECTION ───────────────────────

  /**
   * Get current middleware status — what the agent knows about its own constraints.
   */
  getStatus(): {
    active: boolean;
    expired: boolean;
    remainingNativeBudget: string;
    dailyLimit: string;
    perTxLimit: string;
    whitelistedContracts: number;
    whitelistedFunctions: number;
    violationCount: number;
    recentExecutions: number;
    sessionExpiry: string | null;
  } {
    const expired = this.sessionExpiry ? new Date() > this.sessionExpiry : false;

    return {
      active: !expired,
      expired,
      remainingNativeBudget: formatEther(this.tracker.getRemainingNative()),
      dailyLimit: this.policy.permissions.spending?.native?.dailyLimit || "0 ETH",
      perTxLimit: this.policy.permissions.spending?.native?.perTransaction || "no limit",
      whitelistedContracts: this.contractWhitelist.size,
      whitelistedFunctions: this.functionWhitelist.size,
      violationCount: this.violationCount,
      recentExecutions: this.executionLog.length,
      sessionExpiry: this.sessionExpiry?.toISOString() || null,
    };
  }

  /**
   * Generate a natural language status for the agent to include in its reasoning.
   */
  getStatusPrompt(): string {
    const status = this.getStatus();
    const lines: string[] = [
      "## Current AgentScope Status",
      "",
      `Active: ${status.active ? "✅ YES" : "❌ NO (expired)"}`,
      `Remaining budget: ${status.remainingNativeBudget} ETH of ${status.dailyLimit} daily`,
      `Per-tx limit: ${status.perTxLimit}`,
    ];

    if (status.whitelistedContracts > 0) {
      lines.push(`Whitelisted contracts: ${status.whitelistedContracts}`);
    }
    if (status.whitelistedFunctions > 0) {
      lines.push(`Whitelisted functions: ${status.whitelistedFunctions}`);
    }
    if (status.violationCount > 0) {
      lines.push(`⚠️ Violations this session: ${status.violationCount}`);
    }
    if (status.sessionExpiry) {
      lines.push(`Session expires: ${status.sessionExpiry}`);
    }

    return lines.join("\n");
  }

  /**
   * Sync local state with on-chain state.
   * Call on initialization and after external policy changes.
   */
  async syncWithChain(): Promise<void> {
    try {
      const scope = await this.agentScope.getScope(this.agentAddress);
      const nativeSpent = scope.dailySpendLimitWei - scope.remainingBudget;
      this.tracker.syncFromChain(nativeSpent, new Map());
    } catch (err) {
      // Non-fatal — local tracking continues
    }
  }

  /**
   * Get execution history for audit purposes.
   */
  getExecutionLog(): typeof this.executionLog {
    return [...this.executionLog];
  }

  // ─── PRIVATE HELPERS ──────────────────────────────

  private blocked(
    intent: TransactionIntent,
    reason: string,
    warnings: string[],
  ): PreFlightResult {
    this.violationCount++;
    this.lastViolation = new Date();

    this.executionLog.push({
      timestamp: new Date(),
      intent,
      result: "blocked",
      reason,
    });

    if (this.config.onViolation) {
      this.config.onViolation(intent, reason);
    }

    return {
      allowed: false,
      reason,
      warnings,
      remainingBudget: {
        native: this.tracker.getRemainingNative(),
        tokens: {},
      },
    };
  }

  private checkActiveHours(): boolean {
    const activeHours = this.policy.permissions.temporal?.activeHours;
    if (!activeHours) return true;

    const tz = activeHours.timezone || 'UTC';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find(p => p.type === 'hour')?.value || '00';
    const minutePart = parts.find(p => p.type === 'minute')?.value || '00';
    const dayPart = (parts.find(p => p.type === 'weekday')?.value || 'Mon').toLowerCase().slice(0, 3);
    const currentTime = `${hourPart}:${minutePart}`;
    const currentDay = dayPart;

    for (const window of activeHours.windows) {
      const days = window.days || ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      if (days.includes(currentDay)) {
        if (currentTime >= window.start && currentTime <= window.end) {
          return true;
        }
      }
    }

    return false;
  }
}

// ═══════════════════════════════════════════════════════
//  FACTORY
// ═══════════════════════════════════════════════════════

/**
 * Create middleware from a policy file path or URL.
 */
export async function createMiddleware(
  policySource: string | PolicyDocument,
  agentScope: AgentScope,
  agentAddress: Address,
  options?: Partial<MiddlewareConfig>,
): Promise<AgentScopeMiddleware> {
  let policy: PolicyDocument;

  if (typeof policySource === "string") {
    // Could be a file path, URL, or JSON string
    if (policySource.startsWith("{")) {
      policy = JSON.parse(policySource);
    } else if (policySource.startsWith("http")) {
      const res = await fetch(policySource);
      policy = await res.json();
    } else {
      // File path — requires Node.js fs
      const fs = await import("fs");
      const content = fs.readFileSync(policySource, "utf-8");
      policy = JSON.parse(content);
    }
  } else {
    policy = policySource;
  }

  const middleware = new AgentScopeMiddleware({
    policy,
    agentScope,
    agentAddress,
    ...options,
  });

  // Sync with on-chain state
  await middleware.syncWithChain();

  return middleware;
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function parseAmountToWei(amount: string): bigint {
  const match = amount.match(/([\d.]+)\s*(eth|gwei|wei)?/i);
  if (!match) return 0n;
  const value = match[1];
  const unit = (match[2] || "eth").toLowerCase();
  switch (unit) {
    case "eth": return parseEther(value);
    case "gwei": return parseUnits(value, 9);
    case "wei": return BigInt(value);
    default: return parseEther(value);
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(s|m|h|d)/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 0);
}

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

export { AgentScopeMiddleware as default };
