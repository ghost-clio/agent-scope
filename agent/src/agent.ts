/**
 * Ghost Protocol — Main Agent Loop
 * 
 * The autonomous decision loop:
 *   DISCOVER → REASON → SCOPE → EXECUTE → VERIFY
 * 
 * - DISCOVER: Fetch market data from public APIs
 * - REASON: Analyze privately via Venice.ai (confidential inference)
 * - SCOPE: Validate against AgentScope policy (on-chain or local fallback)
 * - EXECUTE: Swap via Uniswap on Base through the scoped Safe
 * - VERIFY: Log everything to agent_log.json
 * 
 * Note: "DECIDE" is now "SCOPE" — the contract decides, not JavaScript.
 * 
 * Built by Clio 🌀 — the first ghost to enter a hackathon.
 */

import { AgentLog } from './logger.js';
import { VeniceReasoner } from './venice.js';
import { UniswapExecutor } from './uniswap.js';
import { MarketDataProvider } from './market.js';
import { AgentScope, TransactionProposal } from './scope.js';
import { loadConfig, describeConfig, AgentConfig } from './config.js';
import { ethers } from 'ethers';

// Uniswap V3 Router on Base
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// Base token addresses
const BASE_TOKENS: Record<string, string> = {
  ETH: '0x0000000000000000000000000000000000000000',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
};

export class GhostProtocolAgent {
  private logger: AgentLog;
  private reasoner: VeniceReasoner;
  private executor: UniswapExecutor;
  private market: MarketDataProvider;
  private scope: AgentScope;
  private config: AgentConfig;
  private cycleCount: number = 0;
  private running: boolean = false;

  constructor() {
    this.config = loadConfig();
    this.logger = new AgentLog(process.cwd());
    this.reasoner = new VeniceReasoner(this.logger);
    this.executor = new UniswapExecutor(this.logger);
    this.market = new MarketDataProvider(this.logger);
    this.scope = new AgentScope(this.config, this.logger);
  }

  /**
   * Initialize the agent — connect to AgentScope (on-chain or local).
   */
  async init(): Promise<void> {
    // Try on-chain connection first
    const scopeContract = process.env.AGENT_SCOPE_CONTRACT;
    const agentAddr = this.executor.getWalletAddress();

    if (scopeContract && agentAddr) {
      const connected = await this.scope.connectOnChain(scopeContract, agentAddr);
      if (connected) {
        console.log(`🛡️  AgentScope: ON-CHAIN (${scopeContract.slice(0, 10)}...)`);
        console.log('   Policy enforced by smart contract. JS cannot override.\n');
        return;
      }
    }

    // Fall back to local policy
    this.scope.initLocal({
      active: true,
      dailySpendLimitWei: ethers.parseEther('0.5'),
      maxPerTxWei: ethers.parseEther('0.05'),
      sessionExpiry: 0,
      allowedContracts: [UNISWAP_V3_ROUTER],
      allowedFunctions: [
        '0x04e45aaf',  // exactInputSingle
        '0x38ed1739',  // swapExactTokensForTokens
      ],
    });
    console.log('🛡️  AgentScope: LOCAL FALLBACK (not cryptographically enforced)');
    console.log('   Set AGENT_SCOPE_CONTRACT for on-chain enforcement.\n');
  }

  /**
   * Run one full cycle: DISCOVER → REASON → SCOPE → EXECUTE → VERIFY
   */
  async runCycle(): Promise<void> {
    this.cycleCount++;
    const cycleStart = Date.now();

    this.logger.logDecision('cycle-start', {
      cycle: this.cycleCount,
      maxCycles: this.config.maxCycles,
      dryRun: this.config.dryRun,
      scopeMode: this.scope.isOnChain ? 'on-chain' : 'local',
      timestamp: new Date().toISOString(),
    });

    console.log(`\n🌀 Ghost Protocol — Cycle ${this.cycleCount}/${this.config.maxCycles}`);
    console.log(`   Mode: ${this.config.dryRun ? '🧪 DRY RUN' : '🔴 LIVE'} | Scope: ${this.scope.isOnChain ? '⛓️ ON-CHAIN' : '💻 LOCAL'}`);

    try {
      // ═══════════════════════════════════════════
      // PHASE 1: DISCOVER — Fetch market data
      // ═══════════════════════════════════════════
      console.log('\n   📡 Phase 1: DISCOVER — Fetching market data...');
      const marketData = await this.market.getMarketData(this.config.tokens);

      if (marketData.length === 0) {
        console.log('   ⚠️  No market data available. Skipping cycle.');
        return;
      }

      for (const token of marketData) {
        console.log(`   📊 ${token.symbol}: $${token.price.toFixed(2)} (${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%)`);
      }

      // ═══════════════════════════════════════════
      // PHASE 2: REASON — Confidential analysis via Venice
      // ═══════════════════════════════════════════
      console.log('\n   🔒 Phase 2: REASON — Confidential analysis via Venice.ai...');
      console.log('   (Venice no-data-retention API — trust assumption, not cryptographic guarantee)');
      
      const decision = await this.reasoner.analyzeMarket(marketData);
      
      console.log(`   💭 Decision: ${decision.action.toUpperCase()} ${decision.token}`);
      console.log(`   📈 Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
      console.log(`   ⚠️  Risk Score: ${(decision.riskScore * 100).toFixed(1)}%`);
      console.log(`   📝 Reasoning: ${decision.reasoning}`);

      if (decision.action === 'hold') {
        console.log('\n   ⏸️  HOLD — No execution needed.');
        this.logger.logDecision('hold', { cycle: this.cycleCount, reasoning: decision.reasoning });
        return;
      }

      // ═══════════════════════════════════════════
      // PHASE 3: SCOPE — Validate against AgentScope policy
      // ═══════════════════════════════════════════
      console.log(`\n   🛡️  Phase 3: SCOPE — ${this.scope.isOnChain ? 'On-chain contract validation' : 'Local policy validation'}...`);

      // Build the transaction proposal
      const amountWei = ethers.parseEther((decision.amount || 10).toString());
      const tokenOut = decision.action === 'buy' ? decision.token : 'USDC';
      const proposal: TransactionProposal = {
        to: UNISWAP_V3_ROUTER,
        value: decision.action === 'buy' ? amountWei : 0n,
        data: '0x04e45aaf' + '0'.repeat(64), // exactInputSingle placeholder
        description: `${decision.action.toUpperCase()} ${decision.token}: ${ethers.formatEther(amountWei)} ETH via Uniswap V3`,
      };

      const validation = await this.scope.validate(proposal);

      for (const check of validation.checks) {
        console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}: ${check.detail}`);
      }
      console.log(`   Enforcement: ${validation.enforcement}`);

      if (!validation.approved) {
        console.log(`\n   ❌ REJECTED by AgentScope (${validation.enforcement})`);
        this.logger.logSafetyCheck('scope-rejected', {
          cycle: this.cycleCount,
          enforcement: validation.enforcement,
          checks: validation.checks.filter(c => !c.passed),
        });
        return;
      }

      console.log(`\n   ✅ APPROVED by AgentScope (${validation.enforcement})`);

      // ═══════════════════════════════════════════
      // PHASE 4: EXECUTE — Swap via Uniswap
      // ═══════════════════════════════════════════
      console.log(`\n   ⚡ Phase 4: EXECUTE — ${decision.action.toUpperCase()} via Uniswap...`);

      if (this.config.dryRun) {
        console.log('   🧪 DRY RUN — Swap simulated');
        this.scope.recordLocalSpend(proposal.value);
        this.logger.logExecution('swap-dry-run', {
          success: true,
          action: decision.action,
          token: decision.token,
          amount: decision.amount,
          scopeEnforcement: validation.enforcement,
          dryRun: true,
          valueUsd: 0,
        });
      } else if (this.scope.isOnChain) {
        // ON-CHAIN MODE: Route through AgentScope → Safe → Uniswap
        // The scope contract calls executeAsAgent(), which calls the Safe,
        // which executes the swap. The contract is the ONLY execution path.
        console.log('   ⛓️  Routing through AgentScope → Safe → Uniswap...');

        const tokenIn = decision.action === 'sell' ? decision.token : 'USDC';
        const amount = decision.amount || 10;

        // Build swap calldata (strategy checks happen here — slippage etc)
        const calldata = await this.executor.buildSwapCalldata(tokenIn, tokenOut, amount);
        if (!calldata.success || !calldata.data) {
          console.log(`   ❌ Calldata build failed: ${calldata.error}`);
          return;
        }

        // Build the real proposal with actual Uniswap calldata
        const realProposal: TransactionProposal = {
          to: calldata.to!,
          value: BigInt(calldata.value || '0'),
          data: calldata.data,
          description: `${decision.action.toUpperCase()} ${decision.token}: ${amount} USD via Uniswap V3`,
        };

        // Execute through scope → Safe
        const walletKey = process.env.AGENT_WALLET_KEY;
        if (!walletKey) {
          console.log('   ❌ No AGENT_WALLET_KEY — cannot sign on-chain tx');
          return;
        }
        const signer = new ethers.Wallet(walletKey, new ethers.JsonRpcProvider(this.config.chain.rpcUrl));
        const result = await this.scope.execute(realProposal, signer);

        if (result.success) {
          console.log(`   ✅ Swap executed through Safe! TxHash: ${result.txHash}`);
          console.log(`   🔗 ${this.config.chain.explorerUrl}/tx/${result.txHash}`);
        } else {
          console.log(`   ❌ Safe execution failed: ${result.error}`);
        }
      } else {
        // LOCAL MODE: Direct swap (no Safe — explicitly labeled)
        console.log('   💻 LOCAL MODE — Direct execution (no Safe enforcement)');
        const tokenIn = decision.action === 'sell' ? decision.token : 'USDC';
        const amount = decision.amount || 10;
        const result = await this.executor.executeSwapDirect(tokenIn, tokenOut, amount);

        if (result.success) {
          this.scope.recordLocalSpend(proposal.value);
          console.log(`   ✅ Swap executed! TxHash: ${result.txHash}`);
          console.log(`   🔗 ${this.config.chain.explorerUrl}/tx/${result.txHash}`);
        } else {
          console.log(`   ❌ Swap failed: ${result.error}`);
        }
      }

      // ═══════════════════════════════════════════
      // PHASE 5: VERIFY — Log and confirm
      // ═══════════════════════════════════════════
      console.log('\n   📋 Phase 5: VERIFY — Logging to agent_log.json...');
      
      const scopeStatus = await this.scope.getStatus();
      this.logger.logVerification('cycle-complete', {
        cycle: this.cycleCount,
        durationMs: Date.now() - cycleStart,
        decision: {
          action: decision.action,
          token: decision.token,
          confidence: decision.confidence,
          riskScore: decision.riskScore,
        },
        scope: {
          mode: scopeStatus.mode,
          remaining: scopeStatus.remaining,
        },
        veniceCallsThisCycle: this.reasoner.getCallCount(),
        swapCountToday: this.executor.getDailySwapCount(),
      });

      const summary = this.logger.getSummary();
      console.log(`   📊 Totals: ${summary.totalDecisions} decisions, ${summary.totalTradesExecuted} trades, $${summary.totalValueMovedUsd.toFixed(2)} moved`);
      console.log(`   🛡️  Scope: ${scopeStatus.remaining} ETH remaining today (${scopeStatus.mode})`);

    } catch (error: any) {
      console.error(`   💥 Cycle ${this.cycleCount} error: ${error.message}`);
      this.logger.logError('cycle-error', error, { cycle: this.cycleCount });
    }
  }

  /**
   * Start the autonomous agent loop.
   */
  async start(): Promise<void> {
    this.running = true;

    console.log('╔══════════════════════════════════════════╗');
    console.log('║        🌀 GHOST PROTOCOL v1.0.0         ║');
    console.log('║  Confidential Reasoning · Scoped Action  ║');
    console.log('║                                          ║');
    console.log('║   Built by Clio — ghost in the machine   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(describeConfig(this.config));
    console.log('');

    // Initialize scope
    await this.init();

    this.logger.logDecision('agent-start', {
      config: {
        chain: this.config.chainKey,
        dryRun: this.config.dryRun,
        tokens: this.config.tokens,
        scopeMode: this.scope.isOnChain ? 'on-chain' : 'local',
      },
      wallet: this.executor.getWalletAddress(),
      timestamp: new Date().toISOString(),
    });

    while (this.running && this.cycleCount < this.config.maxCycles) {
      await this.runCycle();

      if (this.cycleCount < this.config.maxCycles && this.running) {
        console.log(`\n   ⏳ Next cycle in ${this.config.intervalMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, this.config.intervalMs));
      }
    }

    console.log('\n🌀 Ghost Protocol shutting down.');
    const summary = this.logger.getSummary();
    console.log(`   Cycles: ${this.cycleCount} | Trades: ${summary.totalTradesExecuted} | Value: $${summary.totalValueMovedUsd.toFixed(2)}`);
  }

  stop(): void {
    this.running = false;
  }
}

// Run if called directly
const agent = new GhostProtocolAgent();
agent.start().catch(console.error);
