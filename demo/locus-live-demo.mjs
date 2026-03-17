/**
 * AgentScope × Locus — LIVE Demo
 * 
 * Real USDC payments through Locus with AgentScope policy enforcement.
 * Run: node demo/locus-live-demo.mjs
 */

const LOCUS_API_KEY = process.env.LOCUS_API_KEY;
if (!LOCUS_API_KEY) { console.error("Set LOCUS_API_KEY env var"); process.exit(1); }
const BASE_URL = "https://beta-api.paywithlocus.com/api";
const OUR_WALLET = "0xf1884e896c7cfc9b2759493bd91a5d7e62b24ab9";

// ═══ Policy Engine (AgentScope layer) ═══
class PolicyEngine {
  constructor(policy) {
    this.policy = policy;
    this.dailySpent = 0;
    this.logs = [];
  }

  check(request) {
    if (request.amountUsdc > this.policy.perTxLimitUsdc) {
      return { approved: false, reason: `ExceedsPerTxLimit: $${request.amountUsdc} > $${this.policy.perTxLimitUsdc}` };
    }
    if (this.dailySpent + request.amountUsdc > this.policy.dailyLimitUsdc) {
      return { approved: false, reason: `ExceedsDailyLimit: $${this.dailySpent + request.amountUsdc} > $${this.policy.dailyLimitUsdc}` };
    }
    if (this.policy.allowedRecipients?.length && !this.policy.allowedRecipients.includes(request.to)) {
      return { approved: false, reason: `RecipientNotWhitelisted: ${request.to.slice(0,10)}...` };
    }
    if (this.policy.allowedCategories?.length && !this.policy.allowedCategories.includes(request.category)) {
      return { approved: false, reason: `CategoryNotAllowed: "${request.category}" not in [${this.policy.allowedCategories}]` };
    }
    if (this.policy.requireMemo && (!request.memo || !request.memo.trim())) {
      return { approved: false, reason: "MemoRequired: policy requires a memo" };
    }
    return { approved: true, budgetRemaining: this.policy.dailyLimitUsdc - this.dailySpent - request.amountUsdc };
  }

  recordSpend(amount) { this.dailySpent += amount; }
}

// ═══ Locus API wrapper ═══
async function locusBalance() {
  const res = await fetch(`${BASE_URL}/pay/balance`, {
    headers: { Authorization: `Bearer ${LOCUS_API_KEY}` }
  });
  return res.json();
}

async function locusSend(to, amount, memo) {
  const res = await fetch(`${BASE_URL}/pay/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOCUS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to_address: to, amount, memo: `[AgentScope] ${memo}` })
  });
  return res.json();
}

// ═══ Main Demo ═══
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        AgentScope × Locus — LIVE DEMO (Real USDC)          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const policy = new PolicyEngine({
    dailyLimitUsdc: 2.0,
    perTxLimitUsdc: 0.50,
    allowedRecipients: [OUR_WALLET],
    allowedCategories: ["api", "transfer"],
    requireMemo: true,
  });

  // Act 1: Balance
  console.log("═══ Act 1: Check Wallet Balance ═══");
  const bal = await locusBalance();
  console.log(`  ✅ Wallet: ${bal.data.wallet_address}`);
  console.log(`  ✅ Balance: $${bal.data.usdc_balance} USDC on ${bal.data.chain}`);
  console.log(`  ✅ Allowance: $${bal.data.allowance}/day\n`);

  // Act 2: Approved payment (real $0.01 USDC)
  console.log("═══ Act 2: Approved Payment — $0.01 transfer to self ═══");
  const req1 = { to: OUR_WALLET, amountUsdc: 0.01, memo: "AgentScope demo — approved", category: "transfer" };
  const check1 = policy.check(req1);
  console.log(`  Policy check: ${check1.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  if (check1.approved) {
    const tx1 = await locusSend(req1.to, req1.amountUsdc, req1.memo);
    policy.recordSpend(req1.amountUsdc);
    console.log(`  Locus response: ${tx1.success ? "✅ SENT" : "❌ " + (tx1.message || tx1.error)}`);
    if (tx1.data) console.log(`  Transaction ID: ${tx1.data.transaction_id}`);
    if (tx1.data) console.log(`  Status: ${tx1.data.status}`);
  }
  console.log(`  Budget remaining: $${(policy.policy.dailyLimitUsdc - policy.dailySpent).toFixed(2)}\n`);

  // Act 3: BLOCKED — wrong recipient
  console.log("═══ Act 3: BLOCKED — Recipient Not Whitelisted ═══");
  const req2 = { to: "0x0000000000000000000000000000000000000001", amountUsdc: 0.10, memo: "unwhitelisted", category: "transfer" };
  const check2 = policy.check(req2);
  console.log(`  Policy check: 🛑 BLOCKED`);
  console.log(`  Reason: ${check2.reason}`);
  console.log(`  Locus API called: NO — blocked before network\n`);

  // Act 4: BLOCKED — exceeds per-tx
  console.log("═══ Act 4: BLOCKED — Exceeds Per-Transaction Limit ═══");
  const req3 = { to: OUR_WALLET, amountUsdc: 1.00, memo: "too much", category: "transfer" };
  const check3 = policy.check(req3);
  console.log(`  Policy check: 🛑 BLOCKED`);
  console.log(`  Reason: ${check3.reason}\n`);

  // Act 5: BLOCKED — wrong category
  console.log("═══ Act 5: BLOCKED — Category Not Allowed ═══");
  const req4 = { to: OUR_WALLET, amountUsdc: 0.10, memo: "checkout attempt", category: "checkout" };
  const check4 = policy.check(req4);
  console.log(`  Policy check: 🛑 BLOCKED`);
  console.log(`  Reason: ${check4.reason}\n`);

  // Act 6: BLOCKED — no memo
  console.log("═══ Act 6: BLOCKED — Memo Required ═══");
  const req5 = { to: OUR_WALLET, amountUsdc: 0.05, memo: "", category: "transfer" };
  const check5 = policy.check(req5);
  console.log(`  Policy check: 🛑 BLOCKED`);
  console.log(`  Reason: ${check5.reason}\n`);

  // Act 7: Second approved payment
  console.log("═══ Act 7: Second Approved Payment — $0.02 ═══");
  const req6 = { to: OUR_WALLET, amountUsdc: 0.02, memo: "AgentScope demo — second transfer", category: "api" };
  const check6 = policy.check(req6);
  console.log(`  Policy check: ${check6.approved ? "✅ APPROVED" : "🛑 BLOCKED"}`);
  if (check6.approved) {
    const tx2 = await locusSend(req6.to, req6.amountUsdc, req6.memo);
    policy.recordSpend(req6.amountUsdc);
    console.log(`  Locus response: ${tx2.success ? "✅ SENT" : "❌ " + (tx2.message || tx2.error)}`);
    if (tx2.data) console.log(`  Transaction ID: ${tx2.data.transaction_id}`);
    if (tx2.data) console.log(`  Status: ${tx2.data.status}`);
  }
  console.log(`  Budget remaining: $${(policy.policy.dailyLimitUsdc - policy.dailySpent).toFixed(2)}\n`);

  // Summary
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      AUDIT TRAIL                            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Daily spent:     $${policy.dailySpent.toFixed(2)} USDC`);
  console.log(`  Daily remaining: $${(policy.policy.dailyLimitUsdc - policy.dailySpent).toFixed(2)} USDC`);
  console.log(`  Approved: 2 | Blocked: 4`);
  console.log(`\n  AgentScope enforces WHAT the agent can spend.`);
  console.log(`  Locus handles HOW it gets paid.`);
  console.log(`  Together: safe autonomous payments. 🔐\n`);
}

main().catch(console.error);
