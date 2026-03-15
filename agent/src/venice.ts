/**
 * Venice.ai Private Reasoning Engine
 * 
 * All financial reasoning happens through Venice's no-data-retention API.
 * This means the agent's strategy, analysis, and decision logic are NEVER
 * stored by the inference provider. Private cognition → public action.
 */

import { AgentLog } from './logger.js';

interface VeniceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface MarketData {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

interface TradeDecision {
  action: 'buy' | 'sell' | 'hold';
  token: string;
  confidence: number;
  reasoning: string;  // Private — only stored locally in agent_log
  amount?: number;
  riskScore: number;
}

const DEFAULT_CONFIG: VeniceConfig = {
  apiKey: process.env.VENICE_API_KEY || '',
  model: 'llama-3.3-70b',
  baseUrl: 'https://api.venice.ai/api/v1',
};

export class VeniceReasoner {
  private config: VeniceConfig;
  private logger: AgentLog;
  private callCount: number = 0;
  private readonly MAX_CALLS_PER_HOUR = 60;

  constructor(logger: AgentLog, config?: Partial<VeniceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;

    if (!this.config.apiKey) {
      throw new Error('VENICE_API_KEY is required');
    }
  }

  /**
   * Send a private reasoning request to Venice.ai
   * Zero data retention — Venice does not store prompts or completions.
   */
  private async reason(systemPrompt: string, userPrompt: string): Promise<string> {
    // Budget check
    this.callCount++;
    if (this.callCount > this.MAX_CALLS_PER_HOUR) {
      this.logger.logDecision('budget-exceeded', {
        callCount: this.callCount,
        limit: this.MAX_CALLS_PER_HOUR,
      });
      throw new Error(`Compute budget exceeded: ${this.callCount}/${this.MAX_CALLS_PER_HOUR} calls/hour`);
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Venice API error ${response.status}: ${error}`);
      }

      const data = await response.json() as any;
      const result = data.choices?.[0]?.message?.content || '';
      const elapsed = Date.now() - startTime;

      this.logger.logToolCall('venice-reasoning', {
        model: this.config.model,
        latencyMs: elapsed,
        tokensUsed: data.usage?.total_tokens || 0,
        callNumber: this.callCount,
        // NOTE: We log that reasoning happened, but NOT the actual content
        // The reasoning itself stays in our local agent_log only
      });

      return result;
    } catch (error: any) {
      this.logger.logToolCall('venice-reasoning', {
        error: error.message,
        latencyMs: Date.now() - startTime,
        callNumber: this.callCount,
      });
      throw error;
    }
  }

  /**
   * Analyze market data and decide whether to trade.
   * All analysis happens privately through Venice.
   */
  async analyzeMarket(marketData: MarketData[]): Promise<TradeDecision> {
    const systemPrompt = `You are a conservative autonomous treasury agent. Your job is to analyze 
market data and make trading decisions. You have strict risk parameters:

- Maximum position size: $50 per trade
- Maximum portfolio allocation per token: 20%
- Risk tolerance: LOW (capital preservation > returns)
- Prefer stablecoins and blue-chip tokens (ETH, WBTC)
- Never chase pumps (>50% 24h gain = avoid)
- Slippage tolerance: 1% max

Respond with ONLY a JSON object (no markdown, no explanation) with this exact format:
{
  "action": "buy" | "sell" | "hold",
  "token": "TOKEN_SYMBOL",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "amount_usd": number or null,
  "risk_score": 0.0-1.0
}`;

    const userPrompt = `Current market data:
${marketData.map(d => `${d.symbol}: $${d.price} (${d.priceChange24h > 0 ? '+' : ''}${d.priceChange24h.toFixed(2)}% 24h, vol $${(d.volume24h / 1e6).toFixed(2)}M, mcap $${(d.marketCap / 1e9).toFixed(2)}B)`).join('\n')}

Analyze and provide your trading decision.`;

    const response = await this.reason(systemPrompt, userPrompt);

    try {
      // Parse the JSON response
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const decision = JSON.parse(cleaned);

      const result: TradeDecision = {
        action: decision.action || 'hold',
        token: decision.token || 'ETH',
        confidence: Math.min(1, Math.max(0, decision.confidence || 0)),
        reasoning: decision.reasoning || 'No reasoning provided',
        amount: decision.amount_usd || undefined,
        riskScore: Math.min(1, Math.max(0, decision.risk_score || 0.5)),
      };

      this.logger.logDecision('trade-analysis', {
        action: result.action,
        token: result.token,
        confidence: result.confidence,
        riskScore: result.riskScore,
        reasoning: result.reasoning,
        marketSnapshot: marketData.map(d => ({
          symbol: d.symbol,
          price: d.price,
          change24h: d.priceChange24h,
        })),
      });

      return result;
    } catch (parseError: any) {
      this.logger.logDecision('trade-analysis-parse-error', {
        rawResponse: response.substring(0, 200),
        error: parseError.message,
      });

      // Default to hold on parse failure
      return {
        action: 'hold',
        token: 'ETH',
        confidence: 0,
        reasoning: 'Failed to parse Venice response — defaulting to hold',
        riskScore: 1.0,
      };
    }
  }

  /**
   * Validate a trade before execution — safety check.
   * Returns true if the trade passes all safety guardrails.
   */
  async validateTrade(decision: TradeDecision, portfolioValue: number): Promise<{
    approved: boolean;
    reason: string;
  }> {
    // Hard guardrails (no LLM needed)
    if (decision.action === 'hold') {
      return { approved: true, reason: 'Hold — no action needed' };
    }

    if (decision.confidence < 0.6) {
      this.logger.logDecision('trade-rejected-low-confidence', {
        confidence: decision.confidence,
        threshold: 0.6,
      });
      return { approved: false, reason: `Confidence too low: ${decision.confidence} < 0.6` };
    }

    if (decision.riskScore > 0.7) {
      this.logger.logDecision('trade-rejected-high-risk', {
        riskScore: decision.riskScore,
        threshold: 0.7,
      });
      return { approved: false, reason: `Risk too high: ${decision.riskScore} > 0.7` };
    }

    const amount = decision.amount || 0;
    if (amount > 50) {
      this.logger.logDecision('trade-rejected-over-limit', {
        amount,
        limit: 50,
      });
      return { approved: false, reason: `Amount $${amount} exceeds $50 limit` };
    }

    if (amount > portfolioValue * 0.2) {
      this.logger.logDecision('trade-rejected-overconcentrated', {
        amount,
        portfolioValue,
        maxAllocation: portfolioValue * 0.2,
      });
      return { approved: false, reason: `Amount $${amount} exceeds 20% of portfolio ($${portfolioValue * 0.2})` };
    }

    this.logger.logDecision('trade-approved', {
      action: decision.action,
      token: decision.token,
      amount,
      confidence: decision.confidence,
      riskScore: decision.riskScore,
    });

    return { approved: true, reason: 'All safety checks passed' };
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}
