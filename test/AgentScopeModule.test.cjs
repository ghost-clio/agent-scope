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
        module.setAgentPolicy(agent.address, ONE_ETH, 0, [], [])
      ).to.be.revertedWithCustomError(module, "NotSafe");
    });

    it("should allow Safe to revoke agent", async function () {
      // Set policy first
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, [], [],
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
          agent.address, ONE_ETH, 0, [], [],
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
          agent.address, HALF_ETH, 0, [], [],
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
          agent.address, ONE_ETH, expiry, [], [],
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
          agent.address, ONE_ETH, 0, [allowedAddr], [],
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
          agent.address, ONE_ETH, 0, [], [swapSelector],
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
          agent.address, HALF_ETH, 0, [], [],
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
          agent.address, ONE_ETH, 0, [], [], // empty whitelists = allow all
        ])
      );
    });

    it("should revert when agent targets the module itself", async function () {
      // Agent tries to call setAgentPolicy on the module through executeAsAgent
      const escalationData = module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.MaxUint256, // unlimited spend
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
  });

  describe("Token Allowance Enforcement", function () {
    const TRANSFER_SELECTOR = "0xa9059cbb"; // transfer(address,uint256)
    const APPROVE_SELECTOR = "0x095ea7b3";  // approve(address,uint256)

    beforeEach(async function () {
      // Set policy allowing all contracts/functions
      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address, ONE_ETH, 0, [], [],
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

  describe("Proof of Scope", function () {
    it("should return accurate scope for verification", async function () {
      const expiry = (await time.latest()) + 86400;

      await mockSafe.callModule(
        await module.getAddress(),
        module.interface.encodeFunctionData("setAgentPolicy", [
          agent.address,
          ONE_ETH,
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
          agent.address, HALF_ETH, 0, [], [],
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
});
