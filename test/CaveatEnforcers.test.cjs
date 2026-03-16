const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentScope Caveat Enforcers", function () {
  // ─── AgentSpendLimitEnforcer ────────────────────────────────

  describe("AgentSpendLimitEnforcer", function () {
    let enforcer;
    let owner;

    const DELEGATION_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-delegation"));
    const MODE = ethers.zeroPadValue("0x00", 32);
    const EMPTY_ARGS = "0x";

    function encodeTerms(dailyLimit, maxPerTx) {
      return ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"],
        [dailyLimit, maxPerTx]
      );
    }

    function encodeExecution(target, value) {
      return ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [target, value]
      );
    }

    beforeEach(async function () {
      [owner] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("AgentSpendLimitEnforcer");
      // Pass owner as the delegationManager for testing (so owner can call beforeHook)
      enforcer = await Factory.deploy(owner.address);
      await enforcer.waitForDeployment();
    });

    it("should deploy successfully", async function () {
      expect(await enforcer.getAddress()).to.be.properAddress;
    });

    it("should allow spend within daily limit", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"));
      const execution = encodeExecution(owner.address, ethers.parseEther("0.3"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.not.be.reverted;
    });

    it("should reject spend exceeding daily limit", async function () {
      const terms = encodeTerms(ethers.parseEther("0.5"), ethers.parseEther("1.0"));
      const execution = encodeExecution(owner.address, ethers.parseEther("0.6"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.be.revertedWithCustomError(enforcer, "DailyLimitExceeded");
    });

    it("should reject spend exceeding per-tx limit", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.2"));
      const execution = encodeExecution(owner.address, ethers.parseEther("0.3"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.be.revertedWithCustomError(enforcer, "PerTxLimitExceeded");
    });

    it("should track cumulative daily spend", async function () {
      const terms = encodeTerms(ethers.parseEther("0.5"), ethers.parseEther("0.3"));

      // First tx: 0.2 ETH — OK
      const exec1 = encodeExecution(owner.address, ethers.parseEther("0.2"));
      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec1, DELEGATION_HASH, owner.address, owner.address);

      // Second tx: 0.2 ETH — OK (total: 0.4)
      const exec2 = encodeExecution(owner.address, ethers.parseEther("0.2"));
      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec2, DELEGATION_HASH, owner.address, owner.address);

      // Third tx: 0.2 ETH — BLOCKED (total would be 0.6, limit is 0.5)
      const exec3 = encodeExecution(owner.address, ethers.parseEther("0.2"));
      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec3, DELEGATION_HASH, owner.address, owner.address)
      ).to.be.revertedWithCustomError(enforcer, "DailyLimitExceeded");
    });

    it("should report remaining budget correctly", async function () {
      const dailyLimit = ethers.parseEther("1.0");
      const terms = encodeTerms(dailyLimit, ethers.parseEther("0.5"));
      const exec = encodeExecution(owner.address, ethers.parseEther("0.3"));

      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec, DELEGATION_HASH, owner.address, owner.address);

      const remaining = await enforcer.getRemainingBudget(DELEGATION_HASH, dailyLimit);
      expect(remaining).to.equal(ethers.parseEther("0.7"));
    });

    it("should reject invalid terms (zero daily limit)", async function () {
      const terms = encodeTerms(0, ethers.parseEther("0.5"));
      const execution = encodeExecution(owner.address, ethers.parseEther("0.1"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.be.revertedWithCustomError(enforcer, "InvalidTerms");
    });

    it("should emit SpendRecorded event", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"));
      const execution = encodeExecution(owner.address, ethers.parseEther("0.1"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.emit(enforcer, "SpendRecorded");
    });

    it("should allow zero-value transactions", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"));
      const execution = encodeExecution(owner.address, 0);

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, owner.address)
      ).to.not.be.reverted;
    });
  });

  // ─── AgentScopeEnforcer (Composite) ─────────────────────────

  describe("AgentScopeEnforcer", function () {
    let enforcer;
    let owner, agent;

    const DELEGATION_HASH = ethers.keccak256(ethers.toUtf8Bytes("composite-test"));
    const MODE = ethers.zeroPadValue("0x00", 32);
    const EMPTY_ARGS = "0x";

    function encodeTerms(dailyLimit, maxPerTx, contracts, selectors) {
      return ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "address[]", "bytes4[]"],
        [dailyLimit, maxPerTx, contracts, selectors]
      );
    }

    function encodeExecution(target, value, selector) {
      // Encode: address (32 bytes) + value (32 bytes) + offset (32 bytes) + length (32 bytes) + selector (4 bytes)
      const targetPadded = ethers.zeroPadValue(target, 32);
      const valuePadded = ethers.zeroPadValue(ethers.toBeHex(value), 32);
      // Add some calldata with selector
      if (selector && selector !== "0x") {
        const calldataPadded = ethers.zeroPadValue("0x40", 32); // offset
        const calldataLen = ethers.zeroPadValue("0x04", 32); // length
        return ethers.concat([targetPadded, valuePadded, calldataPadded, calldataLen, selector]);
      }
      return ethers.concat([targetPadded, valuePadded]);
    }

    beforeEach(async function () {
      [owner, agent] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("AgentScopeEnforcer");
      // Pass owner as the delegationManager for testing (so owner can call beforeHook)
      enforcer = await Factory.deploy(owner.address);
      await enforcer.waitForDeployment();
    });

    it("should deploy successfully", async function () {
      expect(await enforcer.getAddress()).to.be.properAddress;
    });

    it("should allow spend within limits with empty whitelists", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"), [], []);
      const execution = encodeExecution(agent.address, ethers.parseEther("0.3"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, agent.address)
      ).to.not.be.reverted;
    });

    it("should reject when contract not whitelisted", async function () {
      const allowed = [ethers.Wallet.createRandom().address];
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"), allowed, []);
      const execution = encodeExecution(agent.address, ethers.parseEther("0.1"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, agent.address)
      ).to.be.revertedWithCustomError(enforcer, "ContractNotWhitelisted");
    });

    it("should allow whitelisted contract", async function () {
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"), [agent.address], []);
      const execution = encodeExecution(agent.address, ethers.parseEther("0.1"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, agent.address)
      ).to.not.be.reverted;
    });

    it("should support pause/unpause", async function () {
      // Pause
      await enforcer.connect(owner).pause();
      expect(await enforcer.isPaused(owner.address)).to.be.true;

      // Should reject when paused
      const terms = encodeTerms(ethers.parseEther("1.0"), ethers.parseEther("0.5"), [], []);
      const execution = encodeExecution(agent.address, ethers.parseEther("0.1"));

      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, agent.address)
      ).to.be.revertedWithCustomError(enforcer, "AgentPaused");

      // Unpause
      await enforcer.connect(owner).unpause();
      expect(await enforcer.isPaused(owner.address)).to.be.false;

      // Should work again
      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, execution, DELEGATION_HASH, owner.address, agent.address)
      ).to.not.be.reverted;
    });

    it("should emit DelegationPaused and DelegationUnpaused events", async function () {
      await expect(enforcer.connect(owner).pause())
        .to.emit(enforcer, "DelegationPaused")
        .withArgs(owner.address, owner.address);

      await expect(enforcer.connect(owner).unpause())
        .to.emit(enforcer, "DelegationUnpaused")
        .withArgs(owner.address, owner.address);
    });

    it("should track cumulative daily spend across multiple txs", async function () {
      const terms = encodeTerms(ethers.parseEther("0.3"), ethers.parseEther("0.2"), [], []);

      // 0.15 — OK
      const exec1 = encodeExecution(agent.address, ethers.parseEther("0.15"));
      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec1, DELEGATION_HASH, owner.address, agent.address);

      // 0.15 — OK (total 0.30)
      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec1, DELEGATION_HASH, owner.address, agent.address);

      // 0.15 — BLOCKED (total would be 0.45)
      await expect(
        enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec1, DELEGATION_HASH, owner.address, agent.address)
      ).to.be.revertedWithCustomError(enforcer, "DailyLimitExceeded");
    });

    it("should report remaining budget", async function () {
      const dailyLimit = ethers.parseEther("1.0");
      const terms = encodeTerms(dailyLimit, ethers.parseEther("0.5"), [], []);
      const exec = encodeExecution(agent.address, ethers.parseEther("0.4"));

      await enforcer.beforeHook(terms, EMPTY_ARGS, MODE, exec, DELEGATION_HASH, owner.address, agent.address);

      const remaining = await enforcer.getRemainingBudget(DELEGATION_HASH, dailyLimit);
      expect(remaining).to.equal(ethers.parseEther("0.6"));
    });
  });
});
