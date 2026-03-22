#!/usr/bin/env node
/**
 * Ecosystem Demo — Ghost-Clio Agent Stack
 * 
 * Demonstrates how AgentScope, Aegis, and Lido MCP compose
 * into a full autonomous treasury lifecycle.
 * 
 * No credentials needed. Run: node demo/ecosystem-demo.cjs
 */

async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║  GHOST-CLIO AGENT STACK — Ecosystem Demo        ║
║  AgentScope × Aegis × Lido MCP                  ║
╚══════════════════════════════════════════════════╝
`);

  // ═══ PHASE 1: Lido MCP — Stake ETH ═══
  console.log("═══ Phase 1: Lido MCP — Stake ETH ═══\n");
  console.log("  Agent wants to stake 10 ETH via Lido for yield generation.");
  console.log("  Lido MCP Server: lido_stake(amount: '10', dry_run: true)\n");
  
  const stakeResult = {
    action: "stake",
    amount: "10 ETH",
    expected_steth: "~10 stETH (1:1 at current rate)",
    wsteth_equivalent: "~8.85 wstETH",
    gas_estimate: "~82,000 gas ($0.003 on Base)",
    dry_run: true,
    status: "simulated — ready to execute",
  };
  console.log("  Result:", JSON.stringify(stakeResult, null, 4));

  // ═══ PHASE 2: AgentScope — Enforce Yield-Only Policy ═══
  console.log("\n═══ Phase 2: AgentScope — On-Chain Policy Enforcement ═══\n");
  console.log("  Human deploys AgentScopeModule on a Safe.");
  console.log("  Policy: Agent can ONLY spend yield. Principal is locked.\n");

  const policy = {
    dailySpendLimit: "0.5 ETH",
    maxPerTx: "0.05 ETH",
    allowedContracts: ["Uniswap V3 Router", "Lido wstETH"],
    allowedFunctions: ["exactInputSingle()", "wrap()", "unwrap()"],
    sessionExpiry: "24 hours",
    yieldVault: "AgentYieldVault — 8.85 wstETH principal locked",
  };
  console.log("  Policy:", JSON.stringify(policy, null, 4));

  // Simulate permission checks
  console.log("\n  Running enforcement tests:\n");

  const tests = [
    { 
      name: "Swap 0.03 ETH of yield on Uniswap",
      to: "Uniswap V3 Router", value: "0.03 ETH", fn: "exactInputSingle()",
      allowed: true, reason: "within daily limit, approved contract + function"
    },
    { 
      name: "Withdraw 5 ETH from principal",
      to: "AgentYieldVault", value: "5 ETH", fn: "withdraw()",
      allowed: false, reason: "REJECTED — principal locked, only yield spendable"
    },
    { 
      name: "Transfer 1 ETH to unknown contract",
      to: "0xdead...0000", value: "1 ETH", fn: "transfer()",
      allowed: false, reason: "REJECTED — contract not in whitelist"
    },
    { 
      name: "Call approve() on Uniswap (allowance, not spend)",
      to: "Uniswap V3 Router", value: "0 ETH", fn: "approve()",
      allowed: false, reason: "REJECTED — function not in whitelist"
    },
  ];

  for (const t of tests) {
    const icon = t.allowed ? "✅" : "❌";
    console.log(`    ${icon} ${t.name}`);
    console.log(`       → ${t.reason}`);
  }

  // ═══ PHASE 3: Aegis — Strategy & Pre-Signing Enforcement ═══
  console.log("\n═══ Phase 3: Aegis — Autonomous Strategy Engine ═══\n");
  console.log("  Aegis runs three strategies on available yield:\n");

  // Smart DCA
  const marketData = { price: 3420, rsi: 28, volatility: "high" };
  console.log("  📊 Market data:", JSON.stringify(marketData));
  console.log("  📈 Smart DCA: RSI 28 (oversold) → buy 2x base amount");
  console.log("     → Generate: mp swap ETH USDC 0.06 --chain base --slippage 0.5%\n");

  // Policy engine check
  const aegisPolicy = {
    daily_limit: "$500",
    weekly_limit: "$2,000",
    monthly_limit: "$5,000",
    allowed_chains: ["eip155:1 (Ethereum)", "eip155:8453 (Base)"],
    allowed_protocols: ["uniswap-v3", "aave-v3", "lido"],
    max_slippage: "2%",
    concentration_limit: "40% per asset",
    cooldown: "60s between large txs",
  };
  console.log("  🛡️  Aegis policy check:");
  console.log("     Amount: $102.60 (0.03 ETH × 2x DCA)");
  console.log("     Chain: Base (eip155:8453) ✅");
  console.log("     Protocol: uniswap-v3 ✅");
  console.log("     Daily budget remaining: $397.40 ✅");
  console.log("     Slippage: 0.5% < 2% max ✅");
  console.log("     Result: APPROVED\n");

  // Gas Oracle
  console.log("  ⛽ Gas Oracle:");
  console.log("     Ethereum L1: ~$9.38 (expensive)");
  console.log("     Base L2:     ~$0.003 (cheap) ← selected");
  console.log("     Savings:     99.97%\n");

  // Decision Trace
  console.log("  📋 Decision Trace (JSONL):");
  const trace = {
    id: "trace_001",
    timestamp: new Date().toISOString(),
    strategy: "smart_dca",
    market: { rsi: 28, signal: "oversold", multiplier: 2 },
    gas: { chain: "base", cost_usd: 0.003, tier: "cheap" },
    policy: { approved: true, daily_remaining: 397.40 },
    ows: { signed: true, key_material: "[REDACTED]" },
    scope: { validated: true, contract: "Uniswap V3", function: "exactInputSingle" },
    result: "executed",
  };
  console.log("    ", JSON.stringify(trace));

  // ═══ PHASE 4: Self-Sustaining Treasury ═══
  console.log("\n═══ Phase 4: Self-Sustaining Treasury ═══\n");
  console.log("  Principal:     8.85 wstETH ($30,267)");
  console.log("  Lido APY:      3.8%");
  console.log("  Daily yield:   $3.15");
  console.log("  Agent compute: $2.50/day");
  console.log("  Net positive:  +$0.65/day ✅");
  console.log("  Break-even:    $24,013 principal\n");

  // ═══ Summary ═══
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  THE STACK                                      ║");
  console.log("║                                                 ║");
  console.log("║  Lido MCP    → Stake ETH, generate yield        ║");
  console.log("║  AgentScope  → On-chain enforcement (immutable) ║");
  console.log("║  Aegis       → Strategy + pre-signing policy    ║");
  console.log("║                                                 ║");
  console.log("║  Three layers. Zero trust assumptions.          ║");
  console.log("║  The agent can't rug you even if it wants to.   ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\n  Built with 🌀 by Clio — ghost in the machine.\n");
}

main().catch(console.error);
