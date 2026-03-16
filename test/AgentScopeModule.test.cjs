const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgentScopeModule", function () {
  let module, mockSafe;
  let owner, agent, otherAgent, randomContract;
  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");
  const QUARTER_ETH = ethers.parseEther("0.25");

  // Deploy a minimal mock Safe for testing
  async function deployMockSafe() {
    const MockSafe = await ethers.getContractFactory("MockSafe");
    return await MockSafe.deploy();
  }

  beforeEach(async function () {
    [owner, agent, otherAgent, randomContract] = await ethers.getSigners();
    mockSafe = await deployMockSafe();
    
    const AgentScopeModule = await ethers.getContractFactory("AgentScopeModule");
    module = await AgentScopeModule.deploy(await mockSafe.getAddress());

    // Fund the mock safe
    await owner.sendTransaction({ to: await mockSafe.getAddress(), value: ethers.parseEther("10") });
  });

  describe("Policy Management", function () {
    it("should allow Safe to set agent policy", async function () {
      // Simulate call from Safe
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address,
          ONE_ETH,
          0, // no per-tx limit
          0, // no expiry
          [],
          [],
        ])
      );

      const scope = await module.getAgentScope(agent.address);
      expect(scope.active).to.be.true;
      expect(scope.dailySpendLimitWei).to.equal(ONE_ETH);
      expect(scope.remainingBudget).to.equal(ONE_ETH);
    });

    it("should reject non-Safe callers setting policy", async function () {
      await expect(
        module.setAgentPolicy(agent.address, ONE_ETH, 0, 0, [], [])
      ).to.be.revertedWithCustomError(module, "NotSafe");
    });

    it("should allow Safe to revoke agent", async function () {
      // Set policy first
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Revoke
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("revokeAgent", [agent.address])
      );

      const scope = await module.getAgentScope(agent.address);
      expect(scope.active).to.be.false;
    });
  });

  describe("Execution — Happy Path", function () {
    beforeEach(async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );
    });

    it("should allow agent to execute within limits", async function () {
      await expect(
        module.connect(agent).executeAsAgent(
          randomContract.address,
          QUARTER_ETH,
          "0x"
        )
      ).to.emit(module, "AgentExecuted");
    });

    it("should track remaining budget correctly", async function () {
      await module.connect(agent).executeAsAgent(
        randomContract.address,
        QUARTER_ETH,
        "0x"
      );

      const scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(ONE_ETH - QUARTER_ETH);
    });
  });

  describe("Execution — Policy Violations", function () {
    it("should revert when agent is not active", async function () {
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "AgentNotActive");
    });

    it("should revert when daily limit exceeded", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, HALF_ETH, 0, 0, [], [],
        ])
      );

      // First tx — should succeed
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // Second tx — should also succeed (0.25 + 0.25 = 0.5 = limit)
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // Third tx — should fail (would exceed limit)
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "DailyLimitExceeded");
    });

    it("should revert when session expired", async function () {
      const expiry = (await time.latest()) + 3600; // 1 hour from now

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, expiry, [], [],
        ])
      );

      // Should work before expiry
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // Fast forward past expiry
      await time.increase(3601);

      // Should fail after expiry
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "SessionExpired");
    });

    it("should revert when contract not whitelisted", async function () {
      const allowedAddr = otherAgent.address; // arbitrary allowed contract

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [allowedAddr], [],
        ])
      );

      // Call to non-whitelisted contract should fail
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "ContractNotWhitelisted");
    });

    it("should revert when function not whitelisted", async function () {
      const swapSelector = "0x38ed1739"; // uniswap swap selector
      const approveSelector = "0x095ea7b3"; // ERC20 approve selector

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [swapSelector],
        ])
      );

      // Calling with approve selector should fail
      const fakeApproveData = approveSelector + "0".repeat(128);
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, 0, fakeApproveData)
      ).to.be.revertedWithCustomError(module, "FunctionNotWhitelisted");
    });
  });

  describe("Budget Reset", function () {
    it("should reset daily budget after 24 hours", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, HALF_ETH, 0, 0, [], [],
        ])
      );

      // Spend full budget
      await module.connect(agent).executeAsAgent(randomContract.address, HALF_ETH, "0x");

      // Should be at zero
      let scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(0);

      // Fast forward 24h
      await time.increase(86401);

      // Budget should be reset
      scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(HALF_ETH);

      // Should be able to spend again
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");
    });
  });

  describe("Security — Self-Targeting Prevention", function () {
    beforeEach(async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [], // empty whitelists = allow all
        ])
      );
    });

    it("should revert when agent targets the module itself", async function () {
      // Agent tries to call setAgentPolicy on the module through executeAsAgent
      const escalationData = module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.MaxUint256, // unlimited spend
        0,                 // no per-tx limit
        0,                 // no expiry
        [],
        [],
      ]);

      await expect(
        module.connect(agent).executeAsAgent(
          await module.getAddress(),
          0,
          escalationData
        )
      ).to.be.revertedWithCustomError(module, "CannotTargetModule");
    });

    it("should block self-targeting in checkPermission too", async function () {
      const [allowed, reason] = await module.checkPermission(
        agent.address,
        await module.getAddress(),
        0,
        "0x"
      );
      expect(allowed).to.be.false;
      expect(reason).to.equal("cannot_target_module");
    });

    it("should revert when agent targets the Safe itself", async function () {
      // Agent tries to call the Safe directly — privilege escalation vector
      await expect(
        module.connect(agent).executeAsAgent(
          await mockSafe.getAddress(),
          0,
          "0x"
        )
      ).to.be.revertedWithCustomError(module, "CannotTargetModule");
    });

    it("should block Safe-targeting in checkPermission", async function () {
      const [allowed, reason] = await module.checkPermission(
        agent.address,
        await mockSafe.getAddress(),
        0,
        "0x"
      );
      expect(allowed).to.be.false;
      expect(reason).to.equal("cannot_target_module");
    });
  });

  describe("Token Allowance Enforcement", function () {
    const TRANSFER_SELECTOR = "0xa9059cbb"; // transfer(address,uint256)
    const APPROVE_SELECTOR = "0x095ea7b3";  // approve(address,uint256)

    beforeEach(async function () {
      // Set policy allowing all contracts/functions
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );
    });

    it("should enforce token transfer limits when allowance is set", async function () {
      const tokenAddr = randomContract.address;
      const allowance = ethers.parseEther("100"); // 100 tokens/day

      // Set token allowance
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setTokenAllowance", [
          agent.address, tokenAddr, allowance,
        ])
      );

      // Encode transfer(address,uint256) — 200 tokens (exceeds allowance)
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const transferData = TRANSFER_SELECTOR + abiCoder.encode(
        ["address", "uint256"],
        [owner.address, ethers.parseEther("200")]
      ).slice(2);

      await expect(
        module.connect(agent).executeAsAgent(tokenAddr, 0, transferData)
      ).to.be.revertedWithCustomError(module, "TokenLimitExceeded");
    });

    it("should allow transfers within token allowance", async function () {
      const tokenAddr = randomContract.address;
      const allowance = ethers.parseEther("100");

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setTokenAllowance", [
          agent.address, tokenAddr, allowance,
        ])
      );

      // Transfer 50 tokens — within limit
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const transferData = TRANSFER_SELECTOR + abiCoder.encode(
        ["address", "uint256"],
        [owner.address, ethers.parseEther("50")]
      ).slice(2);

      await expect(
        module.connect(agent).executeAsAgent(tokenAddr, 0, transferData)
      ).to.emit(module, "AgentExecuted");
    });

    it("should not enforce token limits when no allowance is set", async function () {
      // No setTokenAllowance called — allowance is 0 (means unrestricted)
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const transferData = TRANSFER_SELECTOR + abiCoder.encode(
        ["address", "uint256"],
        [owner.address, ethers.parseEther("999999")]
      ).slice(2);

      // Should succeed because no allowance = unrestricted
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, 0, transferData)
      ).to.emit(module, "AgentExecuted");
    });
  });

  describe("Per-Transaction Limit", function () {
    it("should enforce per-tx limit", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, QUARTER_ETH, 0, [], [], // 0.25 ETH per tx, 1 ETH daily
        ])
      );

      // 0.25 ETH — exactly at limit, should succeed
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // 0.5 ETH — exceeds per-tx limit
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, HALF_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "PerTxLimitExceeded");
    });

    it("should allow multiple txs within per-tx limit up to daily", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, HALF_ETH, QUARTER_ETH, 0, [], [], // 0.25/tx, 0.5/day
        ])
      );

      // Two txs of 0.25 each = 0.5 daily limit
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // Third tx hits daily limit
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "DailyLimitExceeded");
    });
  });

  describe("Emergency Pause", function () {
    beforeEach(async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );
    });

    it("should block all execution when paused", async function () {
      // Pause
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setPaused", [true])
      );

      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.be.revertedWithCustomError(module, "ModulePaused");
    });

    it("should resume after unpause", async function () {
      // Pause then unpause
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setPaused", [true])
      );
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setPaused", [false])
      );

      // Should work again
      await expect(
        module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x")
      ).to.emit(module, "AgentExecuted");
    });

    it("should reflect pause in checkPermission", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setPaused", [true])
      );

      const [allowed, reason] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0x"
      );
      expect(allowed).to.be.false;
      expect(reason).to.equal("module_paused");
    });
  });

  describe("TransferFrom Enforcement", function () {
    const TRANSFER_FROM_SELECTOR = "0x23b872dd";

    beforeEach(async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );
    });

    it("should enforce token limits on transferFrom", async function () {
      const tokenAddr = randomContract.address;
      const allowance = ethers.parseEther("100");

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setTokenAllowance", [
          agent.address, tokenAddr, allowance,
        ])
      );

      // transferFrom(address from, address to, uint256 amount) — 200 tokens exceeds
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const transferFromData = TRANSFER_FROM_SELECTOR + abiCoder.encode(
        ["address", "address", "uint256"],
        [owner.address, agent.address, ethers.parseEther("200")]
      ).slice(2);

      await expect(
        module.connect(agent).executeAsAgent(tokenAddr, 0, transferFromData)
      ).to.be.revertedWithCustomError(module, "TokenLimitExceeded");
    });
  });

  describe("Proof of Scope", function () {
    it("should return accurate scope for verification", async function () {
      const expiry = (await time.latest()) + 86400;

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address,
          ONE_ETH,
          0,
          expiry,
          [randomContract.address],
          ["0x38ed1739"],
        ])
      );

      const scope = await module.getAgentScope(agent.address);
      expect(scope.active).to.be.true;
      expect(scope.dailySpendLimitWei).to.equal(ONE_ETH);
      expect(scope.sessionExpiry).to.equal(expiry);
      expect(scope.remainingBudget).to.equal(ONE_ETH);
      expect(scope.allowedContracts).to.include(randomContract.address);
      expect(scope.allowedFunctions).to.include("0x38ed1739");
    });

    it("should allow pre-flight permission check", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, HALF_ETH, 0, 0, [], [],
        ])
      );

      const [allowed, reason] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0x"
      );
      expect(allowed).to.be.true;
      expect(reason).to.equal("");

      // Check a tx that would exceed limit
      const [allowed2, reason2] = await module.checkPermission(
        agent.address, randomContract.address, ONE_ETH, "0x"
      );
      expect(allowed2).to.be.false;
      expect(reason2).to.equal("daily_limit_exceeded");
    });
  });

  describe("Edge Cases — Policy Lifecycle", function () {
    it("should return inactive scope for unregistered agent", async function () {
      const [signers] = await ethers.getSigners();
      const unknownAgent = ethers.Wallet.createRandom();

      const scope = await module.getAgentScope(unknownAgent.address);
      expect(scope.active).to.be.false;
      expect(scope.dailySpendLimitWei).to.equal(0);
      expect(scope.remainingBudget).to.equal(0);
    });

    it("should allow re-activation after revoke", async function () {
      // Set policy
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );
      expect((await module.getAgentScope(agent.address)).active).to.be.true;

      // Revoke
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("revokeAgent", [agent.address])
      );
      expect((await module.getAgentScope(agent.address)).active).to.be.false;

      // Re-activate
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, HALF_ETH, 0, 0, [], [],
        ])
      );
      const scope = await module.getAgentScope(agent.address);
      expect(scope.active).to.be.true;
      expect(scope.dailySpendLimitWei).to.equal(HALF_ETH);
    });

    it("should emit events for policy set and revoke", async function () {
      await expect(
        mockSafe.callModule(
          await module.getAddress(),
          module.interface.encodeFunctionData("setAgentPolicy", [
            agent.address, ONE_ETH, HALF_ETH, 0, [], [],
          ])
        )
      ).to.emit(module, "AgentPolicySet")
        .withArgs(agent.address, ONE_ETH, HALF_ETH, 0);

      await expect(
        mockSafe.callModule(
          await module.getAddress(),
          module.interface.encodeFunctionData("revokeAgent", [agent.address])
        )
      ).to.emit(module, "AgentRevoked")
        .withArgs(agent.address);
    });

    it("should emit GlobalPause event when paused", async function () {
      await expect(
        mockSafe.callModule(
          await module.getAddress(),
          module.interface.encodeFunctionData("setPaused", [true])
        )
      ).to.emit(module, "GlobalPause").withArgs(true);

      await expect(
        mockSafe.callModule(
          await module.getAddress(),
          module.interface.encodeFunctionData("setPaused", [false])
        )
      ).to.emit(module, "GlobalPause").withArgs(false);
    });

    it("should allow multiple contracts in whitelist", async function () {
      const [, , , , c1, c2, c3] = await ethers.getSigners();

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0,
          [c1.address, c2.address, c3.address],
          [],
        ])
      );

      // All three should be allowed
      const [ok1] = await module.checkPermission(agent.address, c1.address, QUARTER_ETH, "0x");
      const [ok2] = await module.checkPermission(agent.address, c2.address, QUARTER_ETH, "0x");
      const [ok3] = await module.checkPermission(agent.address, c3.address, QUARTER_ETH, "0x");
      expect(ok1).to.be.true;
      expect(ok2).to.be.true;
      expect(ok3).to.be.true;

      // Non-whitelisted should fail (use an address not in the whitelist)
      const unlisted = ethers.Wallet.createRandom();
      const [ok4] = await module.checkPermission(agent.address, unlisted.address, QUARTER_ETH, "0x");
      expect(ok4).to.be.false;
    });

    it("should check expired session in checkPermission", async function () {
      const expiry = (await time.latest()) + 1; // expires in 1 second
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, expiry, [], [],
        ])
      );

      await time.increase(60); // advance 60 seconds past expiry

      const [allowed, reason] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0x"
      );
      expect(allowed).to.be.false;
      expect(reason).to.equal("session_expired");
    });

    it("should accumulate budget correctly across multiple transactions", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, QUARTER_ETH, 0, [], [],
        ])
      );

      // Execute 3 x 0.25 ETH = 0.75 ETH spent
      for (let i = 0; i < 3; i++) {
        await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");
      }

      const scope = await module.getAgentScope(agent.address);
      const spent = ONE_ETH - scope.remainingBudget;
      expect(spent).to.equal(QUARTER_ETH * 3n);

      // 4th tx would exceed daily limit (0.75 spent + 0.3 ETH > 1.0 ETH limit)
      const [allowed] = await module.checkPermission(
        agent.address, randomContract.address, ethers.parseEther("0.3"), "0x"
      );
      expect(allowed).to.be.false;
    });

    it("should allow any contract when whitelist is empty", async function () {
      // No contracts in whitelist = any contract allowed
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Should be able to call any contract
      const [allowed] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0x"
      );
      expect(allowed).to.be.true;
    });

    it("should allow any function when function whitelist is empty", async function () {
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Any function selector should work
      const [allowed] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0xdeadbeef"
      );
      expect(allowed).to.be.true;
    });

    it("should block non-whitelisted function when function whitelist is set", async function () {
      const swapSelector = "0x38ed1739";
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [swapSelector],
        ])
      );

      // Whitelisted selector allowed
      const [ok1] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, swapSelector
      );
      expect(ok1).to.be.true;

      // Non-whitelisted selector blocked
      const [ok2, reason] = await module.checkPermission(
        agent.address, randomContract.address, QUARTER_ETH, "0xdeadbeef"
      );
      expect(ok2).to.be.false;
      expect(reason).to.equal("function_not_whitelisted");
    });

    it("setAgentPolicy does NOT reset spend when limit unchanged (whitelist-only update)", async function () {
      // Set policy with 1 ETH limit
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Agent spends 0.5 ETH
      await module.connect(agent).executeAsAgent(randomContract.address, HALF_ETH, "0x");

      let scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(HALF_ETH); // 0.5 ETH spent

      // Update policy with SAME limit, different whitelist — spend should NOT reset
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [randomContract.address], [],
        ])
      );

      scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(HALF_ETH); // spend preserved
    });

    it("setAgentPolicy DOES reset spend when daily limit increases", async function () {
      // Set policy with 1 ETH limit
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Agent spends 0.5 ETH
      await module.connect(agent).executeAsAgent(randomContract.address, HALF_ETH, "0x");

      let scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(HALF_ETH); // 0.5 ETH spent

      // Update policy with HIGHER limit — spend should reset
      const TWO_ETH = ethers.parseEther("2");
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, TWO_ETH, 0, 0, [], [],
        ])
      );

      scope = await module.getAgentScope(agent.address);
      expect(scope.remainingBudget).to.equal(TWO_ETH); // reset — fresh 2 ETH budget
    });

    it("checkPermission returns token_limit_exceeded for over-limit ERC20 transfer", async function () {
      // Deploy a mock ERC20 token to use as the "contract" target
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Test Token", "TEST");
      await token.waitForDeployment();
      const tokenAddr = await token.getAddress();

      // Set agent policy
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, 0, [], [],
        ])
      );

      // Set a token allowance of 100 tokens (100e18)
      const allowance = ethers.parseEther("100");
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setTokenAllowance", [
          agent.address, tokenAddr, allowance,
        ])
      );

      // Build transfer(address,uint256) calldata for 200 tokens (over limit)
      const overAmount = ethers.parseEther("200");
      const transferData = token.interface.encodeFunctionData("transfer", [
        randomContract.address,
        overAmount,
      ]);

      const [allowed, reason] = await module.checkPermission(
        agent.address, tokenAddr, 0, transferData
      );
      expect(allowed).to.be.false;
      expect(reason).to.equal("token_limit_exceeded");

      // Within-limit transfer should be allowed
      const okAmount = ethers.parseEther("50");
      const okData = token.interface.encodeFunctionData("transfer", [
        randomContract.address,
        okAmount,
      ]);
      const [allowed2] = await module.checkPermission(
        agent.address, tokenAddr, 0, okData
      );
      expect(allowed2).to.be.true;
    });

    it("two agents should have independent budgets", async function () {
      const budget = HALF_ETH;

      // Set same policy for both agents
      for (const a of [agent, otherAgent]) {
        await mockSafe.callModule(
          await module.getAddress(),
          module.interface.encodeFunctionData("setAgentPolicy", [
            a.address, budget, 0, 0, [], [],
          ])
        );
      }

      // agent spends 0.25 ETH
      await module.connect(agent).executeAsAgent(randomContract.address, QUARTER_ETH, "0x");

      // otherAgent should still have full budget
      const scope1 = await module.getAgentScope(agent.address);
      const scope2 = await module.getAgentScope(otherAgent.address);

      expect(scope1.remainingBudget).to.equal(QUARTER_ETH); // HALF - QUARTER
      expect(scope2.remainingBudget).to.equal(HALF_ETH);   // untouched
    });
  });
});
