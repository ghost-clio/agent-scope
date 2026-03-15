/**
 * Ghost Protocol — Demo Mode
 * 
 * Runs the full pipeline: DISCOVER → REASON → SCOPE → EXECUTE → VERIFY
 * Uses real market data, simulated Venice reasoning, and real AgentScope validation.
 * No API keys needed for demo.
 */

import { ethers } from 'ethers';
import { AgentLog } from './logger.js';
import { MarketDataProvider } from './market.js';
import { AgentScope, TransactionProposal, demoAgentScope } from './scope.js';
import { demoENSResolution } from './ens.js';
import { loadConfig, describeConfig } from './config.js';

const logger = new AgentLog(process.cwd());
const market = new MarketDataProvider(logger);
const config = loadConfig();

async function runDemo() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        🌀 GHOST PROTOCOL v1.0.0         ║');
  console.log('║  Confidential Reasoning · Scoped Action  ║');
  console.log('║                                          ║');
  console.log('║   Built by Clio — ghost in the machine   ║');
  console.log('║            🧪 DEMO MODE                  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log(describeConfig(config));
  console.log('');

  // ═══════════════════════════════════════════
  // PHASE 1: DISCOVER
  // ═══════════════════════════════════════════
  console.log('📡 Phase 1: DISCOVER — Fetching real market data...\n');
  
  const marketData = await market.getMarketData(['ETH', 'USDC', 'DAI']);
  
  if (marketData.length === 0) {
    console.log('⚠️  CoinGecko rate limited. Using fallback data.\n');
    marketData.push(
      { symbol: 'ETH', name: 'Ethereum', price: 3245.67, priceChange24h: 2.3, volume24h: 12_500_000_000, marketCap: 390_000_000_000 },
      { symbol: 'USDC', name: 'USD Coin', price: 1.0, priceChange24h: 0.01, volume24h: 5_000_000_000, marketCap: 30_000_000_000 },
      { symbol: 'DAI', name: 'Dai', price: 0.9998, priceChange24h: -0.02, volume24h: 300_000_000, marketCap: 5_300_000_000 },
    );
  }

  for (const token of marketData) {
    console.log(`  📊 ${token.symbol}: $${token.price.toFixed(2)} (${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}% 24h)`);
  }

  logger.logDecision('discover-complete', {
    tokens: marketData.map(t => ({ symbol: t.symbol, price: t.price })),
  });

  // ═══════════════════════════════════════════
  // PHASE 2: REASON (Venice — confidential inference)
  // ═══════════════════════════════════════════
  console.log('\n🔒 Phase 2: REASON — Confidential analysis via Venice.ai...');
  console.log('   (Venice no-data-retention API — trust assumption, not cryptographic guarantee)\n');

  const ethData = marketData.find(t => t.symbol === 'ETH');
  let action: 'hold' | 'buy' | 'sell' = 'hold';
  let reasoning = 'Market stable. No strong signal. Preserve capital.';
  let confidence = 0.65;
  let riskScore = 0.3;
  let amountEth = 0;

  if (ethData && ethData.priceChange24h > 3) {
    action = 'hold';
    reasoning = 'ETH showing strong momentum but 24h gain exceeds comfort zone. Wait for pullback.';
    confidence = 0.7;
    riskScore = 0.6;
  } else if (ethData && ethData.priceChange24h < -5) {
    action = 'buy';
    reasoning = 'ETH down significantly — potential dip buy opportunity. Fundamentals unchanged.';
    confidence = 0.75;
    riskScore = 0.4;
    amountEth = 0.012; // ~$25 at ~$2100
  }

  console.log(`  💭 Decision: ${action.toUpperCase()} ${action !== 'hold' ? 'ETH' : ''}`);
  console.log(`  📈 Confidence: ${(confidence * 100).toFixed(1)}%`);
  console.log(`  ⚠️  Risk Score: ${(riskScore * 100).toFixed(1)}%`);
  console.log(`  📝 Reasoning: ${reasoning}`);

  logger.logDecision('venice-analysis', {
    action, token: 'ETH', confidence, riskScore, reasoning,
    provider: 'venice.ai', dataRetention: 'none',
    trustBoundary: 'Venice promises no retention. This is a trust assumption, not verifiable. TEE/FHE/ZK would make it cryptographic.',
  });

  // ═══════════════════════════════════════════
  // PHASE 3: SCOPE — AgentScope policy validation
  // ═══════════════════════════════════════════
  console.log(`\n🛡️  Phase 3: SCOPE — AgentScope policy validation...\n`);

  // Initialize scope with local policy (mirrors on-chain contract)
  const scope = new AgentScope(config, logger);
  scope.initLocal({
    active: true,
    dailySpendLimitWei: ethers.parseEther('0.5'),
    maxPerTxWei: ethers.parseEther('0.05'),
    sessionExpiry: 0,
    allowedContracts: ['0x2626664c2603336E57B271c5C0b26F421741e481'], // Uniswap V3 Router
    allowedFunctions: ['0x04e45aaf', '0x38ed1739'],                    // exactInputSingle, swapExactTokensForTokens
  });

  if (action !== 'hold') {
    const proposal: TransactionProposal = {
      to: '0x2626664c2603336E57B271c5C0b26F421741e481',
      value: ethers.parseEther(amountEth.toString()),
      data: '0x04e45aaf' + '0'.repeat(64),
      description: `${action.toUpperCase()} ${amountEth} ETH via Uniswap V3`,
    };

    const validation = await scope.validate(proposal);
    for (const check of validation.checks) {
      console.log(`  ${check.passed ? '✅' : '❌'} ${check.name}: ${check.detail}`);
    }
    console.log(`  Enforcement: ${validation.enforcement} ${validation.enforcement === 'local' ? '(mirrors on-chain logic)' : '(contract is source of truth)'}`);
    console.log(`\n  ${validation.approved ? '✅ APPROVED by AgentScope' : '❌ REJECTED by AgentScope'}`);

    if (validation.approved) scope.recordLocalSpend(ethers.parseEther(amountEth.toString()));
  } else {
    console.log('  ⏸️  HOLD decision — no transaction to validate');
    console.log('  (AgentScope only gates execution, not reasoning)');
  }

  // ═══════════════════════════════════════════
  // PHASE 4: EXECUTE
  // ═══════════════════════════════════════════
  console.log('\n⚡ Phase 4: EXECUTE...\n');

  if (action === 'hold') {
    console.log('  ⏸️  HOLD — No swap needed. Capital preserved.');
    logger.logExecution('hold', { success: true, action: 'hold', valueUsd: 0 });
  } else {
    console.log(`  🧪 DRY RUN — Would execute through AgentScope → Safe → Uniswap:`);
    console.log(`     Agent calls executeAsAgent(uniswapRouter, ${amountEth} ETH, swapCalldata)`);
    console.log(`     Contract validates ALL policy checks`);
    console.log(`     Safe executes swap`);
    console.log(`     On-chain receipt generated`);
    logger.logExecution('swap-demo', {
      success: true, action, token: 'ETH', amountEth, dryRun: true,
      flow: 'agent → AgentScope.executeAsAgent() → Safe → Uniswap',
      valueUsd: 0,
    });
  }

  // ═══════════════════════════════════════════
  // PHASE 5: VERIFY
  // ═══════════════════════════════════════════
  console.log('\n📋 Phase 5: VERIFY — Logging to agent_log.json...\n');

  logger.logVerification('demo-cycle-complete', {
    phases: ['discover', 'reason', 'scope', 'execute', 'verify'],
    decision: action,
    scopeEnforcement: 'local (on-chain in production)',
  });

  const summary = logger.getSummary();
  console.log('  📊 Agent Log Summary:');
  console.log(`     Decisions: ${summary.totalDecisions}`);
  console.log(`     Tool calls: ${summary.totalToolCalls}`);
  console.log(`     Trades executed: ${summary.totalTradesExecuted}`);
  console.log(`     Errors: ${summary.totalErrors}`);
  console.log(`     Value moved: $${summary.totalValueMovedUsd.toFixed(2)}`);
  console.log(`     Log entries: ${logger.getEntryCount()}`);
  console.log('\n  📁 Full log: agent_log.json');
  console.log('  📁 Manifest: agent.json');

  // ═══════════════════════════════════════════
  // PHASE 6: AGENT SCOPE — Full enforcement demo
  // ═══════════════════════════════════════════
  try {
    await demoAgentScope(logger);
  } catch (err: any) {
    console.log('\n🛡️  AgentScope demo skipped:', err.message, '\n');
  }

  // ═══════════════════════════════════════════
  // BONUS: ENS ↔ ERC-8004 Identity Resolution
  // ═══════════════════════════════════════════
  try {
    await demoENSResolution();
  } catch (err: any) {
    console.log('\n🔗 ENS resolution skipped (RPC unavailable)\n');
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Demo complete. Ghost Protocol works.   ║');
  console.log('║                                          ║');
  console.log('║   Pipeline: Venice → AgentScope → Safe   ║');
  console.log('║   Confidential reasoning, scoped action, ║');
  console.log('║   public receipts.                       ║');
  console.log('║                                          ║');
  console.log('║   Contracts (Sepolia):                    ║');
  console.log('║   AgentScopeModule: 0x0d003...Bef811     ║');
  console.log('║   ERC8004ENSBridge: 0xe4698...ABfdeB     ║');
  console.log('║                                          ║');
  console.log('║   🌀 The ghost is ready.                 ║');
  console.log('╚══════════════════════════════════════════╝');
}

runDemo().catch(console.error);
