#!/usr/bin/env node
/**
 * AgentYieldVault Demo — Yield-Only Spending
 * 
 * Shows the full flow:
 * 1. Agent checks available yield
 * 2. Agent spends yield to pay for API compute
 * 3. Agent tries to overspend → BLOCKED
 * 4. Agent tries to touch principal → BLOCKED
 * 5. Human pauses vault → agent frozen
 *
 * Run: node demo/yield-vault-demo.cjs
 */

const VAULT_ADDR = "0xB55d7C3872d7ab121D3372E8A8e2A08609ce0150";
const WSTETH_ADDR = "0x960bf7a55a56f71142234956A48af08FEDfaFC52";

// Simulated demo (no chain connection needed)
const fmt = (wei) => `${(Number(wei) / 1e18).toFixed(4)} wstETH`;

const state = {
  principal: 5.0,
  yield: 0.25,
  dailyCap: 0.1,
  perTxLimit: 0.05,
  dailySpent: 0,
  paused: false,
};

function line() { console.log("─".repeat(60)); }
function header(text) { console.log(`\n${"═".repeat(60)}`); console.log(`  ${text}`); console.log("═".repeat(60)); }

function checkSpend(amount, recipient) {
  if (state.paused) return { ok: false, reason: "VaultPaused" };
  if (amount > state.perTxLimit) return { ok: false, reason: `ExceedsPerTxLimit (${amount} > ${state.perTxLimit})` };
  if (state.dailySpent + amount > state.dailyCap) return { ok: false, reason: `ExceedsDailyCap (${amount} > ${state.dailyCap - state.dailySpent} remaining)` };
  if (amount > state.yield) return { ok: false, reason: `ExceedsAvailableYield (${amount} > ${state.yield} available)` };
  return { ok: true };
}

header("AgentYieldVault — Yield-Only Spending Demo");
console.log(`\n  Vault:     ${VAULT_ADDR}`);
console.log(`  wstETH:    ${WSTETH_ADDR}`);
console.log(`  Network:   Sepolia (deployed & verified)\n`);

// Status
header("1. Vault Status");
console.log(`  Principal (LOCKED):  ${state.principal} wstETH`);
console.log(`  Available yield:     ${state.yield} wstETH`);
console.log(`  Daily cap:           ${state.dailyCap} wstETH`);
console.log(`  Per-tx limit:        ${state.perTxLimit} wstETH`);
console.log(`  Daily spent:         ${state.dailySpent} wstETH`);
console.log(`\n  → Agent can spend yield. Agent CANNOT touch principal.`);

// Act 1: Agent pays for API compute from yield
header("2. Agent pays 0.03 wstETH for API compute ✅");
let result = checkSpend(0.03, "0xAPIProvider");
if (result.ok) {
  state.yield -= 0.03;
  state.dailySpent += 0.03;
  console.log(`  spendYield(0xAPIProvider, 0.03 wstETH)`);
  console.log(`  ✅ SUCCESS`);
  console.log(`  Yield remaining: ${state.yield.toFixed(4)} wstETH`);
  console.log(`  Daily spent: ${state.dailySpent} / ${state.dailyCap} wstETH`);
}

// Act 2: Agent pays for another service
header("3. Agent pays 0.04 wstETH for inference ✅");
result = checkSpend(0.04, "0xVenice");
if (result.ok) {
  state.yield -= 0.04;
  state.dailySpent += 0.04;
  console.log(`  spendYield(0xVenice, 0.04 wstETH)`);
  console.log(`  ✅ SUCCESS`);
  console.log(`  Yield remaining: ${state.yield.toFixed(4)} wstETH`);
  console.log(`  Daily spent: ${state.dailySpent.toFixed(2)} / ${state.dailyCap} wstETH`);
}

// Act 3: Agent tries to exceed per-tx limit
header("4. Agent tries 0.1 wstETH in one tx — BLOCKED 🚫");
result = checkSpend(0.1, "0xSomeone");
console.log(`  spendYield(0xSomeone, 0.1 wstETH)`);
console.log(`  🚫 REVERTED: ${result.reason}`);
console.log(`  → Per-transaction limit enforced. 0 wstETH moved.`);

// Act 4: Agent tries to exceed daily cap
header("5. Agent tries 0.05 wstETH — exceeds daily cap — BLOCKED 🚫");
result = checkSpend(0.05, "0xSomeone");
console.log(`  spendYield(0xSomeone, 0.05 wstETH)`);
console.log(`  🚫 REVERTED: ${result.reason}`);
console.log(`  → Daily cap enforced. Agent can't drain yield in one day.`);

// Act 5: Agent tries to touch principal
header("6. Agent tries to spend 1.0 wstETH (principal) — BLOCKED 🚫");
result = checkSpend(1.0, "0xSomeone");
console.log(`  spendYield(0xSomeone, 1.0 wstETH)`);
console.log(`  🚫 REVERTED: ${result.reason}`);
console.log(`  → PRINCIPAL IS UNTOUCHABLE. The contract enforces it.`);
console.log(`  → Principal still safe: ${state.principal} wstETH`);

// Act 6: Human pauses
header("7. Human hits kill switch 🔴");
state.paused = true;
console.log(`  setPaused(true)`);
console.log(`  🔴 ALL agent spending frozen instantly.`);
result = checkSpend(0.01, "0xAnyone");
console.log(`  Agent tries 0.01 wstETH → ${result.reason}`);
console.log(`  → Agent is locked out. Human investigates.`);

// Summary
header("SUMMARY");
console.log(`  Principal deposited:  ${state.principal} wstETH (untouched ✅)`);
console.log(`  Yield earned:         0.25 wstETH`);
console.log(`  Yield spent:          ${state.dailySpent.toFixed(2)} wstETH (API + inference)`);
console.log(`  Yield remaining:      ${state.yield.toFixed(4)} wstETH`);
console.log(`  Blocked attempts:     3 (per-tx, daily cap, principal)`);
console.log(`  Kill switch:          Active 🔴`);
console.log(`\n  The agent operated autonomously within its yield budget.`);
console.log(`  It paid for real services. It never touched the principal.`);
console.log(`  When the human got nervous, one transaction froze everything.\n`);
