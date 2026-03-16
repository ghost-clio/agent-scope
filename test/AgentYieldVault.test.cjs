const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentYieldVault", function () {
  let vault, mockToken, owner, agent, recipient, outsider;
  const DEPOSIT = ethers.parseEther("10");
  const YIELD_AMOUNT = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, agent, recipient, outsider] = await ethers.getSigners();

    // Deploy a mock ERC20 as "wstETH" — we simulate yield by minting extra tokens to vault
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Wrapped stETH", "wstETH");
    await mockToken.waitForDeployment();

    // Mint tokens to owner
    await mockToken.mint(owner.address, ethers.parseEther("100"));

    // Deploy vault
    const Vault = await ethers.getContractFactory("AgentYieldVault");
    vault = await Vault.deploy(await mockToken.getAddress());
    await vault.waitForDeployment();

    // Approve vault
    await mockToken.approve(await vault.getAddress(), ethers.MaxUint256);
  });

  describe("Setup", function () {
    it("should set owner correctly", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("should set yield token correctly", async function () {
      expect(await vault.yieldToken()).to.equal(await mockToken.getAddress());
    });

    it("should start with no principal", async function () {
      expect(await vault.principalShares()).to.equal(0);
    });
  });

  describe("Principal deposit", function () {
    it("should accept principal deposit", async function () {
      await vault.depositPrincipal(DEPOSIT);
      expect(await vault.principalShares()).to.equal(DEPOSIT);
      expect(await vault.totalBalance()).to.equal(DEPOSIT);
    });

    it("should track cumulative deposits", async function () {
      await vault.depositPrincipal(DEPOSIT);
      await vault.depositPrincipal(DEPOSIT);
      expect(await vault.principalShares()).to.equal(DEPOSIT * 2n);
    });

    it("should reject non-owner deposit", async function () {
      await expect(vault.connect(agent).depositPrincipal(DEPOSIT))
        .to.be.revertedWithCustomError(vault, "OnlyOwner");
    });

    it("should reject zero deposit", async function () {
      await expect(vault.depositPrincipal(0))
        .to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("Principal withdrawal", function () {
    beforeEach(async function () {
      await vault.depositPrincipal(DEPOSIT);
    });

    it("should allow owner to withdraw principal", async function () {
      const before = await mockToken.balanceOf(owner.address);
      await vault.withdrawPrincipal(DEPOSIT);
      const after_ = await mockToken.balanceOf(owner.address);
      expect(after_ - before).to.equal(DEPOSIT);
      expect(await vault.principalShares()).to.equal(0);
    });

    it("should reject agent withdrawing principal", async function () {
      await expect(vault.connect(agent).withdrawPrincipal(DEPOSIT))
        .to.be.revertedWithCustomError(vault, "OnlyOwner");
    });

    it("should reject withdrawing more than principal", async function () {
      await expect(vault.withdrawPrincipal(DEPOSIT + 1n))
        .to.be.reverted;
    });
  });

  describe("Agent management", function () {
    it("should set agent", async function () {
      await vault.setAgent(agent.address);
      expect(await vault.agent()).to.equal(agent.address);
    });

    it("should revoke agent", async function () {
      await vault.setAgent(agent.address);
      await vault.revokeAgent();
      expect(await vault.agent()).to.equal(ethers.ZeroAddress);
    });

    it("should reject non-owner setting agent", async function () {
      await expect(vault.connect(agent).setAgent(agent.address))
        .to.be.revertedWithCustomError(vault, "OnlyOwner");
    });
  });

  describe("Yield spending", function () {
    beforeEach(async function () {
      // Deposit principal
      await vault.depositPrincipal(DEPOSIT);
      // Set agent
      await vault.setAgent(agent.address);
      // Simulate yield: mint extra tokens directly to vault
      await mockToken.mint(await vault.getAddress(), YIELD_AMOUNT);
    });

    it("should show available yield", async function () {
      expect(await vault.availableYield()).to.equal(YIELD_AMOUNT);
    });

    it("should allow agent to spend yield", async function () {
      const spend = ethers.parseEther("0.1");
      await vault.connect(agent).spendYield(recipient.address, spend);
      expect(await mockToken.balanceOf(recipient.address)).to.equal(spend);
      expect(await vault.availableYield()).to.equal(YIELD_AMOUNT - spend);
    });

    it("should block agent from spending more than yield", async function () {
      const tooMuch = YIELD_AMOUNT + 1n;
      await expect(vault.connect(agent).spendYield(recipient.address, tooMuch))
        .to.be.revertedWithCustomError(vault, "ExceedsAvailableYield");
    });

    it("should NEVER let agent touch principal", async function () {
      // Try to spend all balance (principal + yield)
      const total = await vault.totalBalance();
      await expect(vault.connect(agent).spendYield(recipient.address, total))
        .to.be.revertedWithCustomError(vault, "ExceedsAvailableYield");

      // Principal should be untouched
      expect(await vault.principalShares()).to.equal(DEPOSIT);
    });

    it("should reject non-agent spending", async function () {
      await expect(vault.connect(outsider).spendYield(recipient.address, ethers.parseEther("0.1")))
        .to.be.revertedWithCustomError(vault, "OnlyAgent");
    });

    it("should reject spending when paused", async function () {
      await vault.setPaused(true);
      await expect(vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.1")))
        .to.be.revertedWithCustomError(vault, "VaultPaused");
    });

    it("should track total withdrawn yield", async function () {
      const spend = ethers.parseEther("0.1");
      await vault.connect(agent).spendYield(recipient.address, spend);
      await vault.connect(agent).spendYield(recipient.address, spend);
      expect(await vault.totalWithdrawnYield()).to.equal(spend * 2n);
    });
  });

  describe("Spending limits", function () {
    beforeEach(async function () {
      await vault.depositPrincipal(DEPOSIT);
      await vault.setAgent(agent.address);
      await mockToken.mint(await vault.getAddress(), ethers.parseEther("5"));
    });

    it("should enforce per-tx limit", async function () {
      await vault.setSpendingLimits(ethers.parseEther("0.1"), 0);
      await expect(vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.2")))
        .to.be.revertedWithCustomError(vault, "ExceedsPerTxLimit");
    });

    it("should allow within per-tx limit", async function () {
      await vault.setSpendingLimits(ethers.parseEther("0.1"), 0);
      await vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.05"));
      expect(await mockToken.balanceOf(recipient.address)).to.equal(ethers.parseEther("0.05"));
    });

    it("should enforce daily cap", async function () {
      await vault.setSpendingLimits(0, ethers.parseEther("0.3"));
      await vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.2"));
      await vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.1"));
      // At cap now
      await expect(vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.01")))
        .to.be.revertedWithCustomError(vault, "ExceedsDailyCap");
    });
  });

  describe("Recipient whitelist", function () {
    beforeEach(async function () {
      await vault.depositPrincipal(DEPOSIT);
      await vault.setAgent(agent.address);
      await mockToken.mint(await vault.getAddress(), YIELD_AMOUNT);
    });

    it("should allow any recipient when whitelist is empty", async function () {
      await vault.connect(agent).spendYield(outsider.address, ethers.parseEther("0.1"));
      expect(await mockToken.balanceOf(outsider.address)).to.equal(ethers.parseEther("0.1"));
    });

    it("should block non-whitelisted recipient", async function () {
      await vault.addRecipient(recipient.address);
      await expect(vault.connect(agent).spendYield(outsider.address, ethers.parseEther("0.1")))
        .to.be.revertedWithCustomError(vault, "RecipientNotWhitelisted");
    });

    it("should allow whitelisted recipient", async function () {
      await vault.addRecipient(recipient.address);
      await vault.connect(agent).spendYield(recipient.address, ethers.parseEther("0.1"));
      expect(await mockToken.balanceOf(recipient.address)).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("Vault status", function () {
    it("should return full status", async function () {
      await vault.depositPrincipal(DEPOSIT);
      await vault.setAgent(agent.address);
      await mockToken.mint(await vault.getAddress(), YIELD_AMOUNT);

      const status = await vault.getVaultStatus();
      expect(status._principalShares).to.equal(DEPOSIT);
      expect(status._totalBalance).to.equal(DEPOSIT + YIELD_AMOUNT);
      expect(status._availableYield).to.equal(YIELD_AMOUNT);
      expect(status._paused).to.equal(false);
      expect(status._agent).to.equal(agent.address);
    });
  });
});
