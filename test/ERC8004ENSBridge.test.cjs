const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC8004ENSBridge", function () {
  let bridge, mockENS;
  let owner, agent1, agent2, stranger;

  // Use a deterministic namehash for "ghost.eth"
  const GHOST_NODE = ethers.namehash("ghost.eth");
  const TREASURY_NODE = ethers.namehash("treasury.eth");

  // Fake participant IDs (16 bytes)
  const PID_1 = "0x040f2f50c2e942808ee11f25a3bb8996";
  const PID_2 = "0xdeadbeef00000000000000000000cafe";
  const ZERO_PID = "0x00000000000000000000000000000000";

  // Fake L2 registration tx hash
  const REG_TX = ethers.keccak256(ethers.toUtf8Bytes("registration-tx"));
  const MANIFEST = "https://raw.githubusercontent.com/ghost-clio/ghost-protocol/main/agent.json";

  beforeEach(async function () {
    [owner, agent1, agent2, stranger] = await ethers.getSigners();

    // Deploy mock ENS
    const MockENS = await ethers.getContractFactory("MockENS");
    mockENS = await MockENS.deploy();

    // Deploy bridge
    const Bridge = await ethers.getContractFactory("ERC8004ENSBridge");
    bridge = await Bridge.deploy(await mockENS.getAddress());

    // Set ENS ownership: agent1 owns ghost.eth, agent2 owns treasury.eth
    await mockENS.setOwner(GHOST_NODE, agent1.address);
    await mockENS.setOwner(TREASURY_NODE, agent2.address);
  });

  // ─── Registration ──────────────────────────────────────────

  describe("Registration", function () {
    it("should register identity as ENS owner", async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );

      const [active, pid, chainId, txHash, manifest, name] =
        await bridge.resolveAgent(GHOST_NODE);

      expect(active).to.be.true;
      expect(pid).to.equal(PID_1);
      expect(chainId).to.equal(8453n);
      expect(txHash).to.equal(REG_TX);
      expect(manifest).to.equal(MANIFEST);
      expect(name).to.equal("ghost.eth");
    });

    it("should reject registration from non-ENS-owner", async function () {
      await expect(
        bridge.connect(stranger).registerIdentity(
          GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
        )
      ).to.be.revertedWithCustomError(bridge, "NotENSOwner");
    });

    it("should reject double registration of same name", async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );

      await expect(
        bridge.connect(agent1).registerIdentity(
          GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
        )
      ).to.be.revertedWithCustomError(bridge, "AlreadyRegistered");
    });

    it("should reject duplicate participantId", async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );

      // agent2 tries to use the same participantId
      await expect(
        bridge.connect(agent2).registerIdentity(
          TREASURY_NODE, "treasury.eth", PID_1, 8453, REG_TX, MANIFEST
        )
      ).to.be.revertedWithCustomError(bridge, "ParticipantIdTaken");
    });

    it("should reject zero participantId", async function () {
      await expect(
        bridge.connect(agent1).registerIdentity(
          GHOST_NODE, "ghost.eth", ZERO_PID, 8453, REG_TX, MANIFEST
        )
      ).to.be.revertedWithCustomError(bridge, "InvalidParticipantId");
    });

    it("should emit IdentityLinked event", async function () {
      await expect(
        bridge.connect(agent1).registerIdentity(
          GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
        )
      ).to.emit(bridge, "IdentityLinked")
        .withArgs(GHOST_NODE, PID_1, "ghost.eth", 8453, agent1.address);
    });

    it("should track total registered count", async function () {
      expect(await bridge.totalRegistered()).to.equal(0);

      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
      expect(await bridge.totalRegistered()).to.equal(1);

      await bridge.connect(agent2).registerIdentity(
        TREASURY_NODE, "treasury.eth", PID_2, 8453, REG_TX, MANIFEST
      );
      expect(await bridge.totalRegistered()).to.equal(2);
    });
  });

  // ─── Registration Fees ─────────────────────────────────────

  describe("Registration Fees", function () {
    it("should enforce registration fee when set", async function () {
      const fee = ethers.parseEther("0.01");
      await bridge.setRegistrationFee(fee);

      await expect(
        bridge.connect(agent1).registerIdentity(
          GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
        )
      ).to.be.revertedWithCustomError(bridge, "InsufficientFee");

      // Should work with fee
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST,
        { value: fee }
      );

      const [active] = await bridge.resolveAgent(GHOST_NODE);
      expect(active).to.be.true;
    });

    it("should allow owner to withdraw fees", async function () {
      const fee = ethers.parseEther("0.01");
      await bridge.setRegistrationFee(fee);

      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST,
        { value: fee }
      );

      const balBefore = await ethers.provider.getBalance(owner.address);
      const tx = await bridge.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(owner.address);

      expect(balAfter + gasUsed - balBefore).to.equal(fee);
    });

    it("should only allow owner to set fee", async function () {
      await expect(
        bridge.connect(stranger).setRegistrationFee(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });
  });

  // ─── Reverse Lookup ────────────────────────────────────────

  describe("Reverse Lookup", function () {
    beforeEach(async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
    });

    it("should resolve participantId to ENS name", async function () {
      const [found, name, chainId, manifest] =
        await bridge.lookupByParticipantId(PID_1);

      expect(found).to.be.true;
      expect(name).to.equal("ghost.eth");
      expect(chainId).to.equal(8453n);
      expect(manifest).to.equal(MANIFEST);
    });

    it("should return not found for unknown participantId", async function () {
      const [found] = await bridge.lookupByParticipantId(PID_2);
      expect(found).to.be.false;
    });
  });

  // ─── Update Manifest ──────────────────────────────────────

  describe("Update Manifest", function () {
    beforeEach(async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
    });

    it("should allow registrant to update manifest", async function () {
      const newManifest = "https://example.com/agent-v2.json";
      await bridge.connect(agent1).updateManifest(GHOST_NODE, newManifest);

      const [, , , , manifest] = await bridge.resolveAgent(GHOST_NODE);
      expect(manifest).to.equal(newManifest);
    });

    it("should reject update from non-registrant", async function () {
      await expect(
        bridge.connect(stranger).updateManifest(GHOST_NODE, "https://evil.com")
      ).to.be.revertedWithCustomError(bridge, "NotRegistrant");
    });

    it("should emit IdentityUpdated event", async function () {
      const newManifest = "https://example.com/v2.json";
      await expect(
        bridge.connect(agent1).updateManifest(GHOST_NODE, newManifest)
      ).to.emit(bridge, "IdentityUpdated")
        .withArgs(GHOST_NODE, newManifest);
    });
  });

  // ─── Deactivation / Reactivation ──────────────────────────

  describe("Deactivation", function () {
    beforeEach(async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
    });

    it("should deactivate identity", async function () {
      await bridge.connect(agent1).deactivate(GHOST_NODE);
      const [active] = await bridge.resolveAgent(GHOST_NODE);
      expect(active).to.be.false;
    });

    it("should allow owner to deactivate (emergency)", async function () {
      await bridge.connect(owner).deactivate(GHOST_NODE);
      const [active] = await bridge.resolveAgent(GHOST_NODE);
      expect(active).to.be.false;
    });

    it("should reject deactivation from stranger", async function () {
      await expect(
        bridge.connect(stranger).deactivate(GHOST_NODE)
      ).to.be.revertedWithCustomError(bridge, "NotRegistrant");
    });

    it("should reactivate identity", async function () {
      await bridge.connect(agent1).deactivate(GHOST_NODE);
      await bridge.connect(agent1).reactivate(GHOST_NODE);
      const [active] = await bridge.resolveAgent(GHOST_NODE);
      expect(active).to.be.true;
    });

    it("should deactivated identity returns not found in reverse lookup", async function () {
      await bridge.connect(agent1).deactivate(GHOST_NODE);
      const [found] = await bridge.lookupByParticipantId(PID_1);
      expect(found).to.be.false;
    });
  });

  // ─── Capabilities ─────────────────────────────────────────

  describe("Capabilities", function () {
    beforeEach(async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
    });

    it("should add capabilities", async function () {
      await bridge.connect(agent1).addCapability(
        GHOST_NODE, "treasury-management", "1.0.0", "Manages treasury funds"
      );
      await bridge.connect(agent1).addCapability(
        GHOST_NODE, "defi-execution", "1.0.0", "Executes DeFi trades"
      );

      const caps = await bridge.getCapabilities(GHOST_NODE);
      expect(caps.length).to.equal(2);
      expect(caps[0].name).to.equal("treasury-management");
      expect(caps[1].name).to.equal("defi-execution");
    });

    it("should reject capability from non-registrant", async function () {
      await expect(
        bridge.connect(stranger).addCapability(
          GHOST_NODE, "evil-cap", "1.0.0", "nope"
        )
      ).to.be.revertedWithCustomError(bridge, "NotRegistrant");
    });

    it("should clear capabilities", async function () {
      await bridge.connect(agent1).addCapability(
        GHOST_NODE, "cap1", "1.0.0", "test"
      );
      await bridge.connect(agent1).clearCapabilities(GHOST_NODE);

      const caps = await bridge.getCapabilities(GHOST_NODE);
      expect(caps.length).to.equal(0);
    });

    it("should emit CapabilityAdded event", async function () {
      await expect(
        bridge.connect(agent1).addCapability(
          GHOST_NODE, "treasury-management", "1.0.0", "Manages treasury"
        )
      ).to.emit(bridge, "CapabilityAdded")
        .withArgs(GHOST_NODE, "treasury-management", "1.0.0");
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────

  describe("Edge Cases", function () {
    it("should resolve unregistered name as inactive", async function () {
      const [active] = await bridge.resolveAgent(GHOST_NODE);
      expect(active).to.be.false;
    });

    it("should handle multiple agents independently", async function () {
      await bridge.connect(agent1).registerIdentity(
        GHOST_NODE, "ghost.eth", PID_1, 8453, REG_TX, MANIFEST
      );
      await bridge.connect(agent2).registerIdentity(
        TREASURY_NODE, "treasury.eth", PID_2, 8453, REG_TX, "https://treasury.json"
      );

      const [, pid1] = await bridge.resolveAgent(GHOST_NODE);
      const [, pid2] = await bridge.resolveAgent(TREASURY_NODE);

      expect(pid1).to.equal(PID_1);
      expect(pid2).to.equal(PID_2);

      // Reverse lookups work independently
      const [, name1] = await bridge.lookupByParticipantId(PID_1);
      const [, name2] = await bridge.lookupByParticipantId(PID_2);
      expect(name1).to.equal("ghost.eth");
      expect(name2).to.equal("treasury.eth");
    });
  });
});
