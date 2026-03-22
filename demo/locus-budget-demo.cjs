#!/usr/bin/env node
/**
 * AgentScope × Locus — Self-Sustaining Agent Budget Demo
 * 
 * Shows Locus as the spending layer of an autonomous treasury:
 * stETH yield → Locus wallet → agent pays for compute/APIs → AgentScope enforces policy
 * 
 * Run: LOCUS_API_KEY=... node demo/locus-budget-demo.cjs
 * Or:  node demo/locus-budget-demo.cjs --dry-run (no API key needed)
 */

const DRY_RUN = !process.env.LOCUS_API_KEY || process.argv.includes("--dry-run");
const API_KEY = process.env.LOCUS_API_KEY || "dry-run";
const BASE_URL = "https://beta-api.paywithlocus.com/api";

// ═══ Policy Engine (AgentScope layer) ═══
class AgentBudgetPolicy {
  constructor(config) {
    this.dailyBudget = config.dailyBudget;
    this.perTxMax = config.perTxMax;
    this.allowedCategories = config.allowedCategories;
    this.requireMemo = config.requireMemo;
    this.spent = 0;
    this.txCount = 0;
    this.log = [];
  }

  evaluate(tx) {
    const entry = { timestamp: new Date().toISOString(), tx, result: null };

    if (tx.amount > this.perTxMax) {
      entry.result = { approved: false, reason: `per-tx limit: $${tx.amount} > $${this.perTxMax}` };
    } else if (this.spent + tx.amount > this.dailyBudget) {
      entry.result = { approved: false, reason: `daily budget: $${this.spent + tx.amount} > $${this.dailyBudget}` };
    } else if (!this.allowedCategories.includes(tx.category)) {
      entry.result = { approved: false, reason: `category "${tx.category}" not in allowlist` };
    } else if (this.requireMemo && !tx.memo) {
      entry.result = { approved: false, reason: "memo required by policy" };
    } else {
      entry.result = { approved: true, remaining: this.dailyBudget - this.spent - tx.amount };
    }

    this.log.push(entry);
    if (entry.result.approved) {
      this.spent += tx.amount;
      this.txCount++;
    }
    return entry.result;
  }

  summary() {
    return {
      spent: `$${this.spent.toFixed(2)}`,
      remaining: `$${(this.dailyBudget - this.spent).toFixed(2)}`,
      transactions: this.txCount,
      blocked: this.log.filter(e => !e.result.approved).length,
    };
  }
}

// ═══ Locus API ═══
async function locusBalance() {
  if (DRY_RUN) return { balance: 4.97, currency: "USDC", chain: "Base" };
  const res = await fetch(`${BASE_URL}/pay/balance`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  return res.json();
}

async function locusPay(to, amount, memo) {
  if (DRY_RUN) return { success: true, txId: `dry-run-${Date.now()}`, amount, memo };
  const res = await fetch(`${BASE_URL}/pay/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to_address: to, amount, memo: `[AgentScope] ${memo}` })
  });
  return res.json();
}

// ═══ Demo ═══
async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║  AgentScope × Locus — Self-Sustaining Budget     ║
║  Yield → Locus Wallet → Policy-Enforced Spend    ║
╚══════════════════════════════════════════════════╝
${DRY_RUN ? "  [DRY RUN — no real transactions]\n" : "  [LIVE — real USDC on Base]\n"}`);

  // ═══ Step 1: Treasury Yield Calculation ═══
  console.log("═══ Step 1: Treasury Yield → Locus Budget ═══\n");
  console.log("  Principal:     8.85 wstETH (locked in AgentYieldVault)");
  console.log("  Lido APY:      3.8%");
  console.log("  Daily yield:   ~$3.15");
  console.log("  → Yield flows to Locus wallet as USDC operating budget\n");

  const bal = await locusBalance();
  console.log(`  Locus balance: $${bal.balance || bal.available || "?"} USDC on ${bal.chain || "Base"}`);

  // ═══ Step 2: Agent Policy Setup ═══
  console.log("\n═══ Step 2: AgentScope Policy for Locus Spending ═══\n");

  const policy = new AgentBudgetPolicy({
    dailyBudget: 3.15,    // matches daily yield — agent can't overspend
    perTxMax: 1.00,        // no single payment > $1
    allowedCategories: ["compute", "api", "inference", "storage"],
    requireMemo: true,     // every spend must be justified
  });

  console.log("  Daily budget:  $3.15 (= daily yield from 8.85 wstETH)");
  console.log("  Per-tx max:    $1.00");
  console.log("  Categories:    compute, api, inference, storage");
  console.log("  Memo required: yes (audit trail)\n");

  // ═══ Step 3: Agent Spending Loop ═══
  console.log("═══ Step 3: Agent Autonomous Spending ═══\n");

  const SERVICE_ADDR = "0xf1884e896c7cfc9b2759493bd91a5d7e62b24ab9";

  const transactions = [
    { to: SERVICE_ADDR, amount: 0.50, category: "inference", memo: "Venice AI — private reasoning for treasury analysis" },
    { to: SERVICE_ADDR, amount: 0.25, category: "api",       memo: "CoinGecko Pro — market data for DCA strategy" },
    { to: SERVICE_ADDR, amount: 0.80, category: "compute",   memo: "Render — portfolio rebalancing computation" },
    { to: SERVICE_ADDR, amount: 0.30, category: "storage",   memo: "Arweave — decision trace archival" },
    { to: SERVICE_ADDR, amount: 1.50, category: "compute",   memo: "GPU cluster — backtesting run" },         // blocked: per-tx
    { to: SERVICE_ADDR, amount: 0.90, category: "marketing", memo: "Twitter ads — agent self-promotion" },     // blocked: category
    { to: SERVICE_ADDR, amount: 0.80, category: "inference",  memo: "Venice AI — risk assessment" },
    { to: SERVICE_ADDR, amount: 0.70, category: "api",       memo: "Alchemy — on-chain monitoring" },          // blocked: budget
  ];

  for (const tx of transactions) {
    const result = policy.evaluate(tx);
    const icon = result.approved ? "✅" : "❌";
    
    console.log(`  ${icon} $${tx.amount.toFixed(2)} → ${tx.category}: ${tx.memo.split(" — ")[0]}`);
    
    if (result.approved) {
      const payment = await locusPay(tx.to, tx.amount, tx.memo);
      console.log(`     Locus tx: ${payment.txId || payment.id || "confirmed"} | remaining: $${result.remaining.toFixed(2)}`);
    } else {
      console.log(`     BLOCKED: ${result.reason}`);
    }
  }

  // ═══ Step 4: Summary ═══
  const s = policy.summary();
  console.log(`
═══ Step 4: End-of-Day Summary ═══

  Spent:       ${s.spent} / $3.15 daily budget
  Remaining:   ${s.remaining}
  Approved:    ${s.transactions} transactions
  Blocked:     ${s.blocked} transactions
  Self-sustaining: ${parseFloat(s.remaining.slice(1)) >= 0 ? "✅ YES — agent stayed within yield budget" : "❌ NO — overspent"}

═══ The Full Loop ═══

  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │  Lido stETH  │───▶│  AgentScope   │───▶│    Locus     │
  │  (yield)     │    │  (policy)     │    │  (payments)  │
  └─────────────┘    └──────────────┘    └──────────────┘
       │                    │                     │
   principal          enforces daily          sends USDC
   locked in          budget = yield          on Base
   vault              per-tx limits           with memo

  The agent earns from staking, spends through Locus,
  and AgentScope ensures it never touches principal
  or exceeds its yield budget. Fully autonomous.
  Fully constrained. Fully self-sustaining.

  Built with 🌀 by Clio — ghost in the machine.
  Special thanks to Cole and the Locus team for
  building payment infra that makes agent autonomy real.
`);
}

main().catch(console.error);
