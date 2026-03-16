/**
 * AgentScope × Locus Integration
 *
 * Wraps Locus payment execution inside AgentScope policy enforcement.
 * The agent pays for services through Locus — but AgentScope enforces
 * spending limits, recipient whitelists, and daily caps on-chain.
 *
 * Flow:
 *   1. Agent wants to pay for something (API call, service, transfer)
 *   2. AgentScope middleware checks: within budget? allowed recipient? allowed action?
 *   3. If approved → Locus executes the payment
 *   4. If rejected → payment blocked, agent informed why
 *
 * This is the "agents that pay — safely" integration.
 */

// ═══════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════

export interface LocusConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AgentScopePolicy {
  dailyLimitUsdc: number;
  perTxLimitUsdc: number;
  allowedRecipients?: string[];         // wallet addresses or "any"
  allowedCategories?: string[];         // "api", "transfer", "checkout", "deploy"
  activeHours?: { start: string; end: string };
  requireMemo: boolean;
}

export interface PaymentRequest {
  to: string;
  amountUsdc: number;
  memo: string;
  category: "transfer" | "api" | "checkout" | "deploy";
}

export interface PolicyCheckResult {
  approved: boolean;
  reason?: string;
  budgetRemaining?: number;
  dailySpent?: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  policyCheck: PolicyCheckResult;
  error?: string;
}

export interface WalletStatus {
  balance: number;
  address: string;
  chain: string;
  deployed: boolean;
}

export interface ScopedPaymentLog {
  timestamp: string;
  request: PaymentRequest;
  policyCheck: PolicyCheckResult;
  result: PaymentResult | null;
}

// ═══════════════════════════════════════════════════════════
//  AgentScope × Locus Client
// ═══════════════════════════════════════════════════════════

export class ScopedLocusAgent {
  private config: LocusConfig;
  private policy: AgentScopePolicy;
  private dailySpent: number = 0;
  private lastResetDate: string = "";
  private logs: ScopedPaymentLog[] = [];

  constructor(config: LocusConfig, policy: AgentScopePolicy) {
    this.config = {
      baseUrl: "https://beta-api.paywithlocus.com/api",
      ...config,
    };
    this.policy = policy;
  }

  // ─────────────────────────────────────────────────────────
  //  Policy enforcement (AgentScope layer)
  // ─────────────────────────────────────────────────────────

  checkPolicy(request: PaymentRequest): PolicyCheckResult {
    // Reset daily counter if new day
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.lastResetDate) {
      this.dailySpent = 0;
      this.lastResetDate = today;
    }

    // Check per-transaction limit
    if (request.amountUsdc > this.policy.perTxLimitUsdc) {
      return {
        approved: false,
        reason: `ExceedsPerTxLimit: ${request.amountUsdc} > ${this.policy.perTxLimitUsdc} USDC`,
        budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
        dailySpent: this.dailySpent,
      };
    }

    // Check daily limit
    if (this.dailySpent + request.amountUsdc > this.policy.dailyLimitUsdc) {
      return {
        approved: false,
        reason: `ExceedsDailyLimit: ${request.amountUsdc} would bring total to ${this.dailySpent + request.amountUsdc} > ${this.policy.dailyLimitUsdc} USDC`,
        budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
        dailySpent: this.dailySpent,
      };
    }

    // Check allowed recipients
    if (
      this.policy.allowedRecipients &&
      this.policy.allowedRecipients.length > 0 &&
      !this.policy.allowedRecipients.includes(request.to) &&
      !this.policy.allowedRecipients.includes("any")
    ) {
      return {
        approved: false,
        reason: `RecipientNotWhitelisted: ${request.to}`,
        budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
        dailySpent: this.dailySpent,
      };
    }

    // Check allowed categories
    if (
      this.policy.allowedCategories &&
      this.policy.allowedCategories.length > 0 &&
      !this.policy.allowedCategories.includes(request.category)
    ) {
      return {
        approved: false,
        reason: `CategoryNotAllowed: ${request.category} not in [${this.policy.allowedCategories.join(", ")}]`,
        budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
        dailySpent: this.dailySpent,
      };
    }

    // Check active hours
    if (this.policy.activeHours) {
      const now = new Date();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      const currentTime = hours * 60 + minutes;
      const [startH, startM] = this.policy.activeHours.start.split(":").map(Number);
      const [endH, endM] = this.policy.activeHours.end.split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (currentTime < startTime || currentTime > endTime) {
        return {
          approved: false,
          reason: `OutsideActiveHours: current ${hours}:${minutes} UTC, allowed ${this.policy.activeHours.start}-${this.policy.activeHours.end}`,
          budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
          dailySpent: this.dailySpent,
        };
      }
    }

    // Check memo requirement
    if (this.policy.requireMemo && (!request.memo || request.memo.trim() === "")) {
      return {
        approved: false,
        reason: "MemoRequired: policy requires a memo for all transactions",
        budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
        dailySpent: this.dailySpent,
      };
    }

    return {
      approved: true,
      budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent - request.amountUsdc,
      dailySpent: this.dailySpent + request.amountUsdc,
    };
  }

  // ─────────────────────────────────────────────────────────
  //  Payment execution (Locus layer)
  // ─────────────────────────────────────────────────────────

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    // Step 1: AgentScope policy check
    const policyCheck = this.checkPolicy(request);

    const log: ScopedPaymentLog = {
      timestamp: new Date().toISOString(),
      request,
      policyCheck,
      result: null,
    };

    if (!policyCheck.approved) {
      const result: PaymentResult = {
        success: false,
        policyCheck,
        error: `BLOCKED by AgentScope: ${policyCheck.reason}`,
      };
      log.result = result;
      this.logs.push(log);
      return result;
    }

    // Step 2: Execute through Locus
    try {
      const response = await fetch(`${this.config.baseUrl}/pay/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_address: request.to,
          amount: request.amountUsdc,
          memo: `[AgentScope] ${request.memo}`,
        }),
      });

      const data = await response.json() as any;

      if (data.success) {
        this.dailySpent += request.amountUsdc;
        const result: PaymentResult = {
          success: true,
          transactionId: data.data?.transaction_id,
          status: data.data?.status,
          policyCheck,
        };
        log.result = result;
        this.logs.push(log);
        return result;
      } else {
        const result: PaymentResult = {
          success: false,
          policyCheck,
          error: `Locus error: ${data.message || data.error}`,
        };
        log.result = result;
        this.logs.push(log);
        return result;
      }
    } catch (err: any) {
      const result: PaymentResult = {
        success: false,
        policyCheck,
        error: `Network error: ${err.message}`,
      };
      log.result = result;
      this.logs.push(log);
      return result;
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Wallet status
  // ─────────────────────────────────────────────────────────

  async getBalance(): Promise<WalletStatus | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/pay/balance`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      const data = await response.json() as any;
      if (data.success) {
        return {
          balance: parseFloat(data.data?.balance || "0"),
          address: data.data?.address || "",
          chain: data.data?.chain || "base",
          deployed: data.data?.deployed ?? true,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Audit trail
  // ─────────────────────────────────────────────────────────

  getLogs(): ScopedPaymentLog[] {
    return [...this.logs];
  }

  getStatus(): {
    dailySpent: number;
    dailyRemaining: number;
    totalTransactions: number;
    totalBlocked: number;
  } {
    return {
      dailySpent: this.dailySpent,
      dailyRemaining: this.policy.dailyLimitUsdc - this.dailySpent,
      totalTransactions: this.logs.filter((l) => l.result?.success).length,
      totalBlocked: this.logs.filter((l) => !l.policyCheck.approved).length,
    };
  }

  /**
   * Generate a status prompt for the agent's context window.
   * Keeps the agent aware of its spending constraints.
   */
  getAgentPrompt(): string {
    const status = this.getStatus();
    return [
      `[AgentScope × Locus] Payment Status:`,
      `  Daily budget: ${this.policy.dailyLimitUsdc} USDC`,
      `  Spent today: ${status.dailySpent} USDC`,
      `  Remaining: ${status.dailyRemaining} USDC`,
      `  Per-tx limit: ${this.policy.perTxLimitUsdc} USDC`,
      `  Allowed categories: ${this.policy.allowedCategories?.join(", ") || "any"}`,
      `  Transactions: ${status.totalTransactions} approved, ${status.totalBlocked} blocked`,
      `  All payments are logged and auditable.`,
    ].join("\n");
  }
}
