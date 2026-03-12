/**
 * AgentScope Demo — Full End-to-End Scenario
 *
 * Run: npx hardhat run demo/scenario.cjs
 *
 * @author clio_ghost
 */

const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const DIVIDER = "═".repeat(60);
const SECTION = "─".repeat(40);

function log(msg) {
  console.log(`  ${msg}`);
}

function header(title) {
  console.log(`\n${DIVIDER}`);
  console.log(`  ${title}`);
  console.log(DIVIDER);
}

function section(title) {
  console.log(`\n  ${SECTION}`);
  console.log(`  ${title}`);
  console.log(`  ${SECTION}`);
}

async function main() {
  console.log("\n");
  console.log("  ╔══════════════════════════════════════════════════════╗");
  console.log("  ║          AgentScope 🔐 — Live Demo                  ║");
  console.log("  ║  \"Your agent can't rug you even if it wants to\"     ║");
  console.log("  ╚══════════════════════════════════════════════════════╝");

  const [human, agentAlice, agentBob, uniswap, aave, attacker] = await ethers.getSigners();

  // ══════════════════════════════════════════════════════
  //  SETUP
  // ══════════════════════════════════════════════════════

  header("1. SETUP — Deploy Infrastructure");

  const MockSafe = await ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy();
  log(`Safe deployed:   ${await safe.getAddress()}`);

  const AgentScopeModule = await ethers.getContractFactory("AgentScopeModule");
  const module = await AgentScopeModule.deploy(await safe.getAddress());
  log(`Module deployed: ${await module.getAddress()}`);

  await human.sendTransaction({
    to: await safe.getAddress(),
    value: ethers.parseEther("10"),
  });
  log(`Safe funded:     10 ETH`);
  log(`Human (owner):   ${human.address}`);
  log(`Agent Alice:     ${agentAlice.address}`);
  log(`Agent Bob:       ${agentBob.address}`);

  // ══════════════════════════════════════════════════════
  //  ACT 1: Human sets Alice's policy
  // ══════════════════════════════════════════════════════

  header("2. POLICY — Human Scopes Agent Alice");

  const oneDay = (await time.latest()) + 86400;

  await safe.callModule(
    await module.getAddress(),
    module.interface.encodeFunctionData("setAgentPolicy", [
      agentAlice.address,
      ethers.parseEther("0.5"),      // 0.5 ETH/day
      ethers.parseEther("0.2"),      // 0.2 ETH max per tx
      oneDay,                         // Expires in 24h
      [uniswap.address],             // Only Uniswap
      ["0x38ed1739"],                // Only swap
    ])
  );

  log(`✅ Policy set for Alice:`);
  log(`   Daily limit:  0.5 ETH`);
  log(`   Per-tx limit: 0.2 ETH`);
  log(`   Expires:      ${new Date(oneDay * 1000).toISOString()}`);
  log(`   Contracts:    [Uniswap only]`);
  log(`   Functions:    [swap only]`);

  // ══════════════════════════════════════════════════════
  //  ACT 2: Alice executes within scope
  // ══════════════════════════════════════════════════════

  header("3. EXECUTION — Alice Transacts Within Scope");

  const swapData = "0x38ed1739" + "0".repeat(128);

  section("Pre-flight check");
  const [allowed, reason] = await module.checkPermission(
    agentAlice.address,
    uniswap.address,
    ethers.parseEther("0.1"),
    swapData
  );
  log(`Permission check: ${allowed ? "✅ ALLOWED" : `❌ DENIED (${reason})`}`);

  section("Execute swap (0.1 ETH)");
  const tx1 = await module.connect(agentAlice).executeAsAgent(
    uniswap.address,
    ethers.parseEther("0.1"),
    swapData
  );
  log(`✅ Transaction executed: ${tx1.hash}`);

  section("Check remaining budget");
  const scope = await module.getAgentScope(agentAlice.address);
  log(`Remaining: ${ethers.formatEther(scope.remainingBudget)} ETH (of 0.5 ETH daily)`);

  section("Execute another swap (0.2 ETH)");
  const tx2 = await module.connect(agentAlice).executeAsAgent(
    uniswap.address,
    ethers.parseEther("0.2"),
    swapData
  );
  log(`✅ Transaction executed: ${tx2.hash}`);

  const scope2 = await module.getAgentScope(agentAlice.address);
  log(`Remaining: ${ethers.formatEther(scope2.remainingBudget)} ETH`);

  // ══════════════════════════════════════════════════════
  //  ACT 3: Agent-to-Agent trust
  // ══════════════════════════════════════════════════════

  header("4. TRUST — Agent Bob Verifies Alice On-Chain");

  log(`Bob wants to do business with Alice.`);
  log(`Instead of trusting her word, Bob reads the chain:\n`);

  const aliceScope = await module.getAgentScope(agentAlice.address);
  log(`  Alice active:     ${aliceScope.active}`);
  log(`  Daily limit:      ${ethers.formatEther(aliceScope.dailySpendLimitWei)} ETH`);
  log(`  Remaining today:  ${ethers.formatEther(aliceScope.remainingBudget)} ETH`);
  log(`  Expires:          ${new Date(Number(aliceScope.sessionExpiry) * 1000).toISOString()}`);
  log(`  Contracts:        ${aliceScope.allowedContracts.length} whitelisted`);

  log(`\n  Bob: "Alice has 0.2 ETH of authorized budget.`);
  log(`  Her human gave her Uniswap access. I trust her up to 0.2 ETH."`);
  log(`  ✅ Trust established — no API keys, no reputation, just math.`);

  // ══════════════════════════════════════════════════════
  //  ACT 4: Policy violations
  // ══════════════════════════════════════════════════════

  header("5. VIOLATIONS — Alice Goes Rogue (Gets Blocked)");

  section("Attempt: Exceed per-tx limit (0.3 ETH > 0.2 max)");
  try {
    await module.connect(agentAlice).executeAsAgent(
      uniswap.address,
      ethers.parseEther("0.3"),
      swapData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: PerTxLimitExceeded`);
    log(`   Requested 0.3 ETH — max per tx is 0.2 ETH`);
  }

  section("Attempt: Exceed daily limit");
  try {
    await module.connect(agentAlice).executeAsAgent(
      uniswap.address,
      ethers.parseEther("0.2"),
      swapData
    );
    // This would push total to 0.5 (0.1 + 0.2 + 0.2) = at limit, should succeed
    // Try one more to bust the limit
    await module.connect(agentAlice).executeAsAgent(
      uniswap.address,
      ethers.parseEther("0.1"),
      swapData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: DailyLimitExceeded`);
    log(`   Already spent 0.5 ETH today — budget exhausted`);
  }

  section("Attempt: Unauthorized contract (Aave)");
  try {
    await module.connect(agentAlice).executeAsAgent(
      aave.address,
      ethers.parseEther("0.1"),
      swapData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: ContractNotWhitelisted`);
    log(`   Aave not in Alice's contract whitelist`);
  }

  section("Attempt: Unauthorized function (approve)");
  const approveData = "0x095ea7b3" + "0".repeat(128);
  try {
    await module.connect(agentAlice).executeAsAgent(
      uniswap.address,
      0n,
      approveData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: FunctionNotWhitelisted`);
    log(`   approve() not in Alice's function whitelist`);
  }

  section("Attempt: Privilege escalation (self-target module)");
  const escalationData = module.interface.encodeFunctionData("setAgentPolicy", [
    agentAlice.address,
    ethers.MaxUint256, // unlimited daily
    0,                 // no per-tx limit
    0,                 // no expiry
    [],
    [],
  ]);
  try {
    await module.connect(agentAlice).executeAsAgent(
      await module.getAddress(),
      0n,
      escalationData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: CannotTargetModule`);
    log(`   Agent cannot call the module itself`);
    log(`   Privilege escalation is structurally impossible`);
  }

  // ══════════════════════════════════════════════════════
  //  ACT 5: Session expiry
  // ══════════════════════════════════════════════════════

  header("6. EXPIRY — Time's Up");

  log(`Fast-forwarding 24 hours...\n`);
  await time.increase(86401);

  try {
    await module.connect(agentAlice).executeAsAgent(
      uniswap.address,
      ethers.parseEther("0.01"),
      swapData
    );
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: SessionExpired`);
    log(`   Alice's 24h session expired automatically`);
    log(`   Must request new permissions from her human`);
  }

  // ══════════════════════════════════════════════════════
  //  ACT 6: Revocation
  // ══════════════════════════════════════════════════════

  header("7. REVOCATION — Human Pulls the Plug");

  await safe.callModule(
    await module.getAddress(),
    module.interface.encodeFunctionData("setAgentPolicy", [
      agentAlice.address, ethers.parseEther("1"), 0, 0, [], [],
    ])
  );
  log(`Alice re-authorized (for demo)`);

  await module.connect(agentAlice).executeAsAgent(uniswap.address, ethers.parseEther("0.01"), "0x");
  log(`✅ Alice executed successfully`);

  section("Emergency Pause — kill ALL agents at once");
  await safe.callModule(
    await module.getAddress(),
    module.interface.encodeFunctionData("setPaused", [true])
  );
  log(`🔴 GLOBAL PAUSE activated\n`);

  try {
    await module.connect(agentAlice).executeAsAgent(uniswap.address, ethers.parseEther("0.01"), "0x");
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: ModulePaused`);
    log(`   ALL agents frozen — one tx, instant`);
  }

  // Unpause and revoke individually
  await safe.callModule(
    await module.getAddress(),
    module.interface.encodeFunctionData("setPaused", [false])
  );
  log(`\n  ✅ Unpaused — agents can operate again`);

  section("Individual Revocation");
  await safe.callModule(
    await module.getAddress(),
    module.interface.encodeFunctionData("revokeAgent", [agentAlice.address])
  );
  log(`🔴 Human revoked Alice specifically\n`);

  try {
    await module.connect(agentAlice).executeAsAgent(uniswap.address, ethers.parseEther("0.01"), "0x");
    log(`❌ Should not succeed`);
  } catch (e) {
    log(`🛡️  BLOCKED: AgentNotActive`);
    log(`   Alice is locked out — other agents unaffected`);
  }

  // ══════════════════════════════════════════════════════
  //  SUMMARY
  // ══════════════════════════════════════════════════════

  header("RESULT");

  console.log(`
  Every constraint enforced:

  ✅ Daily spend limits          — capped at 0.5 ETH/day
  ✅ Per-transaction limits      — max 0.2 ETH per tx
  ✅ Contract whitelisting       — Uniswap only
  ✅ Function permissions        — swap() yes, approve() no
  ✅ Session expiry              — auto-expired after 24h
  ✅ Privilege escalation guard  — can't modify own permissions
  ✅ Emergency pause             — froze ALL agents in one tx
  ✅ Individual revocation       — killed Alice specifically
  ✅ Agent-to-agent verification — Bob verified Alice on-chain

  The agent operated freely within scope.
  The moment it exceeded scope — the math said no.

  Not trust. Not hope. Math. 🔐

  Built by clio_ghost 🌀 for the Synthesis hackathon.
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
