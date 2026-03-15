/**
 * AgentScope × Venice AI — Private Reasoning, Public Accountability
 *
 * This module demonstrates how an AI agent can use Venice's private inference
 * API for decision-making while operating under AgentScope's on-chain constraints.
 *
 * The agent's REASONING is private (Venice — no data retention, uncensored models).
 * The agent's ACTIONS are public (AgentScope — on-chain spend limits, whitelists).
 *
 * Architecture:
 *   ┌─────────────────────────────────────────┐
 *   │         Venice Private Inference         │
 *   │  • Agent reasons about market data       │
 *   │  • Decision: "swap 0.05 ETH for TOKEN"  │
 *   │  • No logs, no data retention            │
 *   └──────────────┬──────────────────────────┘
 *                  │ decision
 *   ┌──────────────▼──────────────────────────┐
 *   │         AgentScope (On-Chain)            │
 *   │  • Pre-flight: checkPermission()         │
 *   │  • Enforced: daily limit, whitelist      │
 *   │  • Executed: executeAsAgent()            │
 *   │  • Auditable: events on-chain            │
 *   └─────────────────────────────────────────┘
 *
 * @example
 * ```typescript
 * const agent = new VeniceAgent({
 *   veniceApiKey: process.env.VENICE_API_KEY,
 *   agentScope: scopeClient,
 *   model: "llama-3.3-70b",
 * });
 *
 * // Agent privately reasons about the best action
 * const decision = await agent.reason({
 *   context: "ETH price dropped 5% in 1 hour. Portfolio is 80% ETH.",
 *   availableActions: ["swap ETH→USDC", "hold", "buy more ETH"],
 * });
 *
 * // AgentScope enforces constraints before execution
 * const result = await agent.executeDecision(decision);
 * // result.reasoning: PRIVATE (never logged)
 * // result.transaction: PUBLIC (on-chain, auditable)
 * ```
 */

import { AgentScope } from "./index";
import {
  type PublicClient,
  type WalletClient,
  type Address,
  encodeFunctionData,
  parseEther,
} from "viem";

// ─── Types ───────────────────────────────────────────────────

export interface VeniceAgentConfig {
  /** Venice API key */
  veniceApiKey: string;
  /** AgentScope SDK instance */
  agentScope: AgentScope;
  /** Venice model to use (default: llama-3.3-70b) */
  model?: string;
  /** Agent's wallet address */
  agentAddress: Address;
  /** Whether to disable Venice's default system prompt */
  disableVeniceSystemPrompt?: boolean;
  /** Base URL for Venice API */
  baseUrl?: string;
}

export interface ReasoningRequest {
  /** Context for the agent's decision */
  context: string;
  /** Available actions the agent can take */
  availableActions: string[];
  /** Additional constraints to consider */
  constraints?: string;
}

export interface AgentDecision {
  /** The chosen action */
  action: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Target contract address (if applicable) */
  target?: Address;
  /** ETH value to send (if applicable) */
  value?: bigint;
  /** Calldata for the transaction */
  calldata?: `0x${string}`;
  /** Private reasoning (NEVER logged or stored) */
  _privateReasoning: string;
}

export interface ExecutionResult {
  /** Whether the action was executed */
  executed: boolean;
  /** Transaction hash (if executed) */
  txHash?: `0x${string}`;
  /** Reason for rejection (if not executed) */
  rejectionReason?: string;
  /** Whether AgentScope pre-flight passed */
  scopeCheckPassed: boolean;
  /** Remaining daily budget after execution */
  remainingBudget?: bigint;
}

// ─── Venice Agent ────────────────────────────────────────────

export class VeniceAgent {
  private config: VeniceAgentConfig;
  private baseUrl: string;
  private model: string;

  constructor(config: VeniceAgentConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api.venice.ai/api/v1";
    this.model = config.model || "llama-3.3-70b";
  }

  /**
   * Private reasoning — uses Venice's private inference to decide what to do.
   * No data retention. No logs. The reasoning stays between the agent and Venice.
   */
  async reason(request: ReasoningRequest): Promise<AgentDecision> {
    // 1. Get current scope from AgentScope (public info — what CAN we do?)
    const scope = await this.config.agentScope.getScope(
      this.config.agentAddress
    );

    // 2. Build system prompt with scope awareness
    const systemPrompt = `You are an autonomous AI agent operating under on-chain spending constraints.

Your current permissions (from AgentScope on-chain module):
- Daily spend limit: ${scope?.dailySpendLimit || "unknown"} wei
- Remaining budget: ${scope?.remainingBudget || "unknown"} wei
- Session expires: ${scope?.sessionExpiry || "unknown"}
- Active: ${scope?.isActive ? "yes" : "no"}

You MUST choose an action that fits within your constraints.
Respond with a JSON object: { "action": string, "confidence": number (0-1), "reasoning": string }`;

    // 3. Call Venice API — PRIVATE inference
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.veniceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Context: ${request.context}\n\nAvailable actions: ${request.availableActions.join(", ")}\n\n${request.constraints ? `Additional constraints: ${request.constraints}` : ""}`,
          },
        ],
        venice_parameters: {
          include_venice_system_prompt:
            !this.config.disableVeniceSystemPrompt
              ? undefined
              : false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Venice API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content || "";

    // 4. Parse the decision
    try {
      const parsed = JSON.parse(content);
      return {
        action: parsed.action,
        confidence: parsed.confidence || 0.5,
        _privateReasoning: parsed.reasoning || content,
      };
    } catch {
      // If the model didn't return clean JSON, wrap the raw response
      return {
        action: request.availableActions[0] || "hold",
        confidence: 0.3,
        _privateReasoning: content,
      };
    }
  }

  /**
   * Execute a decision through AgentScope — public, constrained, auditable.
   * The private reasoning is NEVER included in the on-chain transaction.
   */
  async executeDecision(decision: AgentDecision): Promise<ExecutionResult> {
    // 1. Pre-flight check through AgentScope
    if (decision.target && decision.calldata) {
      const check = await this.config.agentScope.checkPermission(
        this.config.agentAddress,
        decision.target,
        decision.value || 0n,
        decision.calldata
      );

      if (!check.allowed) {
        return {
          executed: false,
          rejectionReason: check.reason,
          scopeCheckPassed: false,
        };
      }
    }

    // 2. Execute through AgentScope (on-chain)
    if (decision.target && decision.calldata) {
      try {
        const result = await this.config.agentScope.execute(
          decision.target,
          decision.value || 0n,
          decision.calldata
        );

        // Get updated scope
        const scope = await this.config.agentScope.getScope(
          this.config.agentAddress
        );

        return {
          executed: true,
          txHash: result.hash as `0x${string}`,
          scopeCheckPassed: true,
          remainingBudget: scope?.remainingBudget,
        };
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : String(error);
        return {
          executed: false,
          rejectionReason: `Execution failed: ${errMsg}`,
          scopeCheckPassed: true,
        };
      }
    }

    // Action doesn't require on-chain execution (e.g., "hold")
    return {
      executed: true,
      scopeCheckPassed: true,
    };
  }

  /**
   * Full cycle: reason privately, then execute publicly.
   * Returns the execution result — NEVER the private reasoning.
   */
  async act(request: ReasoningRequest): Promise<ExecutionResult> {
    const decision = await this.reason(request);
    return this.executeDecision(decision);
  }
}
