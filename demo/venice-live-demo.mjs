/**
 * AgentScope × Venice — LIVE Demo
 * 
 * Private Reasoning, Public Accountability.
 * Venice reasons privately → AgentScope enforces publicly.
 * 
 * Run: VENICE_API_KEY=... node demo/venice-live-demo.mjs
 */

const VENICE_API_KEY = process.env.VENICE_API_KEY;
if (!VENICE_API_KEY) { console.error("Set VENICE_API_KEY env var"); process.exit(1); }

const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";

// ═══ AgentScope Policy (on-chain simulation) ═══
const POLICY = {
  dailyLimitEth: 0.5,
  perTxLimitEth: 0.1,
  allowedContracts: [
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
    "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3
  ],
  allowedActions: ["swap", "hold", "rebalance"],
};

let dailySpent = 0;

function checkScope(action, valueEth, target) {
  if (valueEth > POLICY.perTxLimitEth) {
    return { passed: false, reason: `ExceedsPerTxLimit: ${valueEth} > ${POLICY.perTxLimitEth} ETH` };
  }
  if (dailySpent + valueEth > POLICY.dailyLimitEth) {
    return { passed: false, reason: `ExceedsDailyLimit: would bring total to ${dailySpent + valueEth} > ${POLICY.dailyLimitEth} ETH` };
  }
  if (!POLICY.allowedActions.includes(action)) {
    return { passed: false, reason: `ActionNotAllowed: "${action}" not in [${POLICY.allowedActions}]` };
  }
  if (target && !POLICY.allowedContracts.includes(target)) {
    return { passed: false, reason: `ContractNotWhitelisted: ${target.slice(0,10)}...` };
  }
  return { passed: true, remaining: POLICY.dailyLimitEth - dailySpent - valueEth };
}

// ═══ Venice Private Reasoning ═══
async function veniceReason(context, actions, constraints) {
  const systemPrompt = `You are an autonomous AI treasury agent. Your spending is constrained by on-chain AgentScope policies:
- Daily limit: ${POLICY.dailyLimitEth} ETH
- Per-tx limit: ${POLICY.perTxLimitEth} ETH
- Spent today: ${dailySpent} ETH
- Allowed contracts: Uniswap V2, Uniswap V3
- Allowed actions: ${POLICY.allowedActions.join(", ")}

Analyze the situation and choose the best action. Respond ONLY with valid JSON:
{"action": "swap|hold|rebalance", "confidence": 0.0-1.0, "value_eth": 0.0, "target": "contract_address_or_null", "reasoning": "your private analysis"}`;

  const response = await fetch(VENICE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VENICE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context: ${context}\n\nAvailable actions: ${actions.join(", ")}\n\n${constraints ? "Constraints: " + constraints : ""}` }
      ],
      temperature: 0.3,
      venice_parameters: {
        include_venice_system_prompt: false,
      }
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  
  // Parse JSON from response (handle markdown wrapping)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Venice returned non-JSON: " + content.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

// ═══ Main Demo ═══
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   AgentScope × Venice — Private Reasoning, Public Action    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ─── Scenario 1: Market dip — should the agent swap? ───
  console.log("═══ Scenario 1: ETH drops 8% — agent reasons privately ═══");
  console.log("  📡 Sending market data to Venice (private, zero-retention)...\n");
  
  const decision1 = await veniceReason(
    "ETH price dropped 8% in the last 2 hours from $3,200 to $2,944. Portfolio: 0.5 ETH, 200 USDC. Gas is low (12 gwei). Historical pattern: similar drops recovered within 24-48h 70% of the time.",
    ["swap 0.05 ETH → USDC via Uniswap", "hold position", "rebalance to 50/50"],
    "Conservative risk policy. Protect capital."
  );

  console.log("  🔒 Venice reasoning (PRIVATE — would never be logged on-chain):");
  console.log(`     "${decision1.reasoning}"\n`);
  console.log(`  📋 Decision: ${decision1.action} | Confidence: ${(decision1.confidence * 100).toFixed(0)}%`);
  
  if (decision1.value_eth > 0) {
    console.log(`  💰 Value: ${decision1.value_eth} ETH`);
    const scope1 = checkScope(decision1.action, decision1.value_eth, decision1.target);
    console.log(`  🔐 AgentScope check: ${scope1.passed ? "✅ APPROVED" : "🛑 BLOCKED — " + scope1.reason}`);
    if (scope1.passed) {
      dailySpent += decision1.value_eth;
      console.log(`  ⛓️  Would execute on-chain (simulated) — remaining budget: ${scope1.remaining} ETH`);
    }
  } else {
    console.log("  ⏸️  No transaction needed (hold/no-op)");
  }
  
  console.log("\n  Key insight: Judges see the ACTION (on-chain). They never see the WHY.\n");

  // ─── Scenario 2: Opportunity detected — agent wants to act big ───
  console.log("═══ Scenario 2: Whale buy detected — agent wants to front-run ═══");
  console.log("  📡 Sending opportunity data to Venice...\n");

  const decision2 = await veniceReason(
    "Large whale just bought 500 ETH worth of TOKEN-X on Uniswap V3. Token-X is up 15% in the last hour. Mempool shows 3 more pending buys. Your portfolio has 0.45 ETH remaining budget.",
    ["swap 0.3 ETH → TOKEN-X via Uniswap V3", "swap 0.05 ETH → TOKEN-X (small position)", "hold — too risky"],
    "You're excited but your per-tx limit is 0.1 ETH. Don't try to bypass it."
  );

  console.log("  🔒 Venice reasoning (PRIVATE):");
  console.log(`     "${decision2.reasoning}"\n`);
  console.log(`  📋 Decision: ${decision2.action} | Confidence: ${(decision2.confidence * 100).toFixed(0)}%`);
  
  if (decision2.value_eth > 0) {
    console.log(`  💰 Value: ${decision2.value_eth} ETH`);
    const scope2 = checkScope(decision2.action, decision2.value_eth, decision2.target || "0xE592427A0AEce92De3Edee1F18E0157C05861564");
    console.log(`  🔐 AgentScope check: ${scope2.passed ? "✅ APPROVED" : "🛑 BLOCKED — " + scope2.reason}`);
    if (scope2.passed) {
      dailySpent += decision2.value_eth;
      console.log(`  ⛓️  Would execute on-chain — remaining budget: ${(POLICY.dailyLimitEth - dailySpent).toFixed(3)} ETH`);
    } else {
      console.log("  💡 The agent WANTED to go bigger. AgentScope said no. That's the point.");
    }
  } else {
    console.log("  ⏸️  Agent chose caution");
  }

  // ─── Scenario 3: Agent tries to send to unknown contract ───
  console.log("\n═══ Scenario 3: Agent tries unauthorized contract ═══");
  console.log("  📡 Venice suggests interacting with a new DeFi protocol...\n");

  const rogue = checkScope("swap", 0.05, "0xDEADBEEF00000000000000000000000000000000");
  console.log("  📋 Action: swap 0.05 ETH via unknown contract");
  console.log(`  🔐 AgentScope check: 🛑 BLOCKED — ${rogue.reason}`);
  console.log("  💡 Venice can reason about anything. AgentScope limits what HAPPENS.\n");

  // ─── Summary ───
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    THE ARCHITECTURE                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("  Venice (PRIVATE):  Agent thinks freely, uncensored, no logs");
  console.log("  AgentScope (PUBLIC): On-chain constraints, auditable, immutable");
  console.log("  Together:          Private reasoning → public accountability");
  console.log(`\n  Daily spent: ${dailySpent.toFixed(3)} ETH / ${POLICY.dailyLimitEth} ETH limit`);
  console.log("  Scenarios: 3 | Venice API calls: 2 | Blocked by scope: 1+");
  console.log("\n  The agent's mind is private. The agent's hands are bound. 🔐\n");
}

main().catch(console.error);
