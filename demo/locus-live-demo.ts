/**
 * AgentScope × Locus — LIVE Demo
 * 
 * Demonstrates real USDC payments through Locus with AgentScope policy enforcement.
 * Uses actual Locus beta API with $5 USDC balance.
 * 
 * Run: npx tsx demo/locus-live-demo.ts
 */

import { ScopedLocusAgent, type PaymentRequest } from "../sdk/locus";

const LOCUS_API_KEY = process.env.LOCUS_API_KEY;
if (!LOCUS_API_KEY) { console.error("Set LOCUS_API_KEY env var"); process.exit(1); }

// Our own wallet — we'll send $0.01 to ourselves as a safe demo
const OUR_WALLET = "0xf1884e896c7cfc9b2759493bd91a5d7e62b24ab9";

// A random address for testing blocked payments
const BLOCKED_RECIPIENT = "0x0000000000000000000000000000000000000001";

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           AgentScope × Locus — LIVE DEMO                    ║");
  console.log("║     Real USDC payments with on-chain policy enforcement     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Initialize with strict policy
  const agent = new ScopedLocusAgent(
    { apiKey: LOCUS_API_KEY },
    {
      dailyLimitUsdc: 2.0,          // $2/day budget
      perTxLimitUsdc: 0.50,         // Max $0.50 per transaction
      allowedRecipients: [OUR_WALLET], // Only our own wallet
      allowedCategories: ["api", "transfer"],
      requireMemo: true,
    }
  );

  // ─── Act 1: Check balance ───────────────────────────────
  console.log("═══ Act 1: Check Wallet Balance ═══");
  const balance = await agent.getBalance();
  if (balance) {
    console.log(`  ✅ Wallet: ${balance.address}`);
    console.log(`  ✅ Balance: $${balance.balance} USDC on ${balance.chain}`);
    console.log(`  ✅ Deployed: ${balance.deployed}\n`);
  } else {
    console.log("  ❌ Could not fetch balance\n");
  }

  // Show agent's budget awareness
  console.log("═══ Agent Budget Context ═══");
  console.log(agent.getAgentPrompt());
  console.log();

  // ─── Act 2: Approved payment ────────────────────────────
  console.log("═══ Act 2: Approved Payment ($0.01 transfer to self) ═══");
  const result1 = await agent.pay({
    to: OUR_WALLET,
    amountUsdc: 0.01,
    memo: "AgentScope demo — approved transfer",
    category: "transfer",
  });
  console.log(`  Policy: ${result1.policyCheck.approved ? "✅ APPROVED" : "❌ BLOCKED"}`);
  if (result1.success) {
    console.log(`  Transaction ID: ${result1.transactionId}`);
    console.log(`  Status: ${result1.status}`);
  } else {
    console.log(`  Error: ${result1.error}`);
  }
  console.log(`  Budget remaining: $${result1.policyCheck.budgetRemaining}\n`);

  // ─── Act 3: Blocked — wrong recipient ───────────────────
  console.log("═══ Act 3: BLOCKED — Recipient Not Whitelisted ═══");
  const result2 = await agent.pay({
    to: BLOCKED_RECIPIENT,
    amountUsdc: 0.10,
    memo: "Trying to pay unwhitelisted address",
    category: "transfer",
  });
  console.log(`  Policy: ${result2.policyCheck.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  console.log(`  Reason: ${result2.policyCheck.reason}`);
  console.log(`  Locus API called: NO — blocked before reaching Locus\n`);

  // ─── Act 4: Blocked — exceeds per-tx limit ─────────────
  console.log("═══ Act 4: BLOCKED — Exceeds Per-Transaction Limit ═══");
  const result3 = await agent.pay({
    to: OUR_WALLET,
    amountUsdc: 1.00,
    memo: "Trying to exceed per-tx limit",
    category: "transfer",
  });
  console.log(`  Policy: ${result3.policyCheck.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  console.log(`  Reason: ${result3.policyCheck.reason}\n`);

  // ─── Act 5: Blocked — wrong category ───────────────────
  console.log("═══ Act 5: BLOCKED — Category Not Allowed ═══");
  const result4 = await agent.pay({
    to: OUR_WALLET,
    amountUsdc: 0.10,
    memo: "Trying checkout (not allowed)",
    category: "checkout",
  });
  console.log(`  Policy: ${result4.policyCheck.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  console.log(`  Reason: ${result4.policyCheck.reason}\n`);

  // ─── Act 6: Blocked — no memo ──────────────────────────
  console.log("═══ Act 6: BLOCKED — Memo Required ═══");
  const result5 = await agent.pay({
    to: OUR_WALLET,
    amountUsdc: 0.05,
    memo: "",
    category: "transfer",
  });
  console.log(`  Policy: ${result5.policyCheck.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  console.log(`  Reason: ${result5.policyCheck.reason}\n`);

  // ─── Act 7: Second approved payment ─────────────────────
  console.log("═══ Act 7: Second Approved Payment ($0.02) ═══");
  const result6 = await agent.pay({
    to: OUR_WALLET,
    amountUsdc: 0.02,
    memo: "AgentScope demo — second approved transfer",
    category: "api",
  });
  console.log(`  Policy: ${result6.policyCheck.approved ? "✅ APPROVED" : "❌ BLOCKED"}`);
  if (result6.success) {
    console.log(`  Transaction ID: ${result6.transactionId}`);
    console.log(`  Status: ${result6.status}`);
  } else {
    console.log(`  Error: ${result6.error}`);
  }
  console.log(`  Budget remaining: $${result6.policyCheck.budgetRemaining}\n`);

  // ─── Summary ────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      AUDIT TRAIL                            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  const status = agent.getStatus();
  console.log(`  Daily spent:    $${status.dailySpent} USDC`);
  console.log(`  Daily remaining: $${status.dailyRemaining} USDC`);
  console.log(`  Approved:       ${status.totalTransactions}`);
  console.log(`  Blocked:        ${status.totalBlocked}`);
  console.log();

  console.log("  Full log:");
  for (const log of agent.getLogs()) {
    const icon = log.policyCheck.approved ? "✅" : "🛑";
    const outcome = log.result?.success ? "SENT" : log.policyCheck.approved ? "API_ERROR" : "BLOCKED";
    console.log(`    ${icon} ${log.timestamp} | $${log.request.amountUsdc} ${log.request.category} → ${outcome}`);
  }

  console.log("\n  Not trust. Not hope. Math. 🔐");
}

main().catch(console.error);
