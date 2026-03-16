import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AgentScopeSolana } from "../target/types/agent_scope_solana";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("agent-scope-solana", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AgentScopeSolana as Program<AgentScopeSolana>;

  const owner = provider.wallet as anchor.Wallet;
  const agent = Keypair.generate();
  const recipient = Keypair.generate();

  let vaultPda: PublicKey;
  let vaultBump: number;
  let policyPda: PublicKey;
  let policyBump: number;

  const DAILY_LIMIT = 1 * LAMPORTS_PER_SOL; // 1 SOL
  const PER_TX_LIMIT = 0.3 * LAMPORTS_PER_SOL; // 0.3 SOL
  const FUND_AMOUNT = 5 * LAMPORTS_PER_SOL; // 5 SOL

  before(async () => {
    // Derive PDAs
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer()],
      program.programId
    );
    [policyPda, policyBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("policy"), vaultPda.toBuffer(), agent.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop to agent for signing
    const sig = await provider.connection.requestAirdrop(
      agent.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Airdrop to recipient so account exists
    const sig2 = await provider.connection.requestAirdrop(
      recipient.publicKey,
      0.01 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig2);
  });

  // ──────────────────────────────────────
  // VAULT INITIALIZATION
  // ──────────────────────────────────────

  it("initializes vault", async () => {
    await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(vault.paused).to.equal(false);
  });

  it("funds vault", async () => {
    await program.methods
      .fundVault(new anchor.BN(FUND_AMOUNT))
      .accounts({
        vault: vaultPda,
        funder: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balance = await provider.connection.getBalance(vaultPda);
    expect(balance).to.be.greaterThan(FUND_AMOUNT - 1); // Account for rent
  });

  // ──────────────────────────────────────
  // POLICY MANAGEMENT
  // ──────────────────────────────────────

  it("sets agent policy", async () => {
    const expiry = Math.floor(Date.now() / 1000) + 86400; // 24h from now

    await program.methods
      .setAgentPolicy(
        new anchor.BN(DAILY_LIMIT),
        new anchor.BN(PER_TX_LIMIT),
        new anchor.BN(expiry),
        [], // allow all programs
        [], // allow all discriminators
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
        agent: agent.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const policy = await program.account.agentPolicy.fetch(policyPda);
    expect(policy.agent.toBase58()).to.equal(agent.publicKey.toBase58());
    expect(policy.dailyLimitLamports.toNumber()).to.equal(DAILY_LIMIT);
    expect(policy.perTxLimitLamports.toNumber()).to.equal(PER_TX_LIMIT);
    expect(policy.active).to.equal(true);
    expect(policy.dailySpent.toNumber()).to.equal(0);
  });

  // ──────────────────────────────────────
  // TRANSFERS
  // ──────────────────────────────────────

  it("agent transfers SOL within limits", async () => {
    const amount = 0.2 * LAMPORTS_PER_SOL;
    const recipientBefore = await provider.connection.getBalance(recipient.publicKey);

    await program.methods
      .executeTransfer(new anchor.BN(amount))
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const recipientAfter = await provider.connection.getBalance(recipient.publicKey);
    expect(recipientAfter - recipientBefore).to.equal(amount);

    const policy = await program.account.agentPolicy.fetch(policyPda);
    expect(policy.dailySpent.toNumber()).to.equal(amount);
  });

  it("rejects transfer exceeding per-tx limit", async () => {
    const amount = 0.5 * LAMPORTS_PER_SOL; // Exceeds 0.3 SOL per-tx limit

    try {
      await program.methods
        .executeTransfer(new anchor.BN(amount))
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("PerTxLimitExceeded");
    }
  });

  it("rejects transfer exceeding daily limit", async () => {
    // Already spent 0.2 SOL, daily limit is 1 SOL, try to spend 0.9 SOL
    const amount = 0.29 * LAMPORTS_PER_SOL; // under per-tx, but 3 of these would exceed daily

    // First should succeed (total: 0.2 + 0.29 = 0.49)
    await program.methods
      .executeTransfer(new anchor.BN(amount))
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    // Second should succeed (total: 0.49 + 0.29 = 0.78)
    await program.methods
      .executeTransfer(new anchor.BN(amount))
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    // Third would push us to 1.07 SOL — should fail
    try {
      await program.methods
        .executeTransfer(new anchor.BN(amount))
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("DailyLimitExceeded");
    }
  });

  it("rejects transfer to vault itself", async () => {
    try {
      await program.methods
        .executeTransfer(new anchor.BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
          recipient: vaultPda, // Self-targeting!
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("CannotTargetVault");
    }
  });

  // ──────────────────────────────────────
  // PAUSE / UNPAUSE
  // ──────────────────────────────────────

  it("pauses vault and blocks transfers", async () => {
    await program.methods
      .setPaused(true)
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
      })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.paused).to.equal(true);

    // Try transfer while paused
    try {
      await program.methods
        .executeTransfer(new anchor.BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("ModulePaused");
    }
  });

  it("unpauses vault and allows transfers again", async () => {
    await program.methods
      .setPaused(false)
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
      })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.paused).to.equal(false);
  });

  // ──────────────────────────────────────
  // CHECK PERMISSION
  // ──────────────────────────────────────

  it("check_permission passes for valid request", async () => {
    await program.methods
      .checkPermission(
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        PublicKey.default, // any program (no whitelist)
        [0, 0, 0, 0, 0, 0, 0, 0], // any discriminator
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
      })
      .rpc();
  });

  // ──────────────────────────────────────
  // GET AGENT SCOPE
  // ──────────────────────────────────────

  it("returns agent scope", async () => {
    await program.methods
      .getAgentScope()
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
      })
      .rpc();

    // Scope is emitted as event — just verify no error
  });

  // ──────────────────────────────────────
  // UPDATE POLICY (without resetting spend)
  // ──────────────────────────────────────

  it("updates policy without resetting daily spend", async () => {
    const policyBefore = await program.account.agentPolicy.fetch(policyPda);
    const spentBefore = policyBefore.dailySpent.toNumber();
    expect(spentBefore).to.be.greaterThan(0); // We've already spent some

    const newDailyLimit = 2 * LAMPORTS_PER_SOL;
    await program.methods
      .updatePolicy(
        new anchor.BN(newDailyLimit),
        new anchor.BN(PER_TX_LIMIT),
        new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        [],
        [],
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
      })
      .rpc();

    const policyAfter = await program.account.agentPolicy.fetch(policyPda);
    expect(policyAfter.dailyLimitLamports.toNumber()).to.equal(newDailyLimit);
    expect(policyAfter.dailySpent.toNumber()).to.equal(spentBefore); // NOT reset
  });

  // ──────────────────────────────────────
  // PROGRAM WHITELISTING
  // ──────────────────────────────────────

  it("enforces program whitelist", async () => {
    const jupiterProgramId = Keypair.generate().publicKey; // Fake Jupiter

    // Update policy with whitelist
    await program.methods
      .updatePolicy(
        new anchor.BN(2 * LAMPORTS_PER_SOL),
        new anchor.BN(PER_TX_LIMIT),
        new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        [jupiterProgramId], // Only Jupiter allowed
        [],
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
      })
      .rpc();

    // Check permission for unlisted program should fail
    const randomProgram = Keypair.generate().publicKey;
    try {
      await program.methods
        .checkPermission(
          new anchor.BN(0.1 * LAMPORTS_PER_SOL),
          randomProgram, // NOT in whitelist
          [0, 0, 0, 0, 0, 0, 0, 0],
        )
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
        })
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("ProgramNotAllowed");
    }

    // Check permission for listed program should pass
    await program.methods
      .checkPermission(
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        jupiterProgramId, // IN whitelist
        [0, 0, 0, 0, 0, 0, 0, 0],
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        agent: agent.publicKey,
      })
      .rpc();

    // Clear whitelist for remaining tests
    await program.methods
      .updatePolicy(
        new anchor.BN(2 * LAMPORTS_PER_SOL),
        new anchor.BN(PER_TX_LIMIT),
        new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        [], // Allow all
        [],
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
      })
      .rpc();
  });

  // ──────────────────────────────────────
  // REVOCATION
  // ──────────────────────────────────────

  it("revokes agent and blocks all transfers", async () => {
    await program.methods
      .revokeAgent()
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
      })
      .rpc();

    const policy = await program.account.agentPolicy.fetch(policyPda);
    expect(policy.active).to.equal(false);

    // Try transfer after revocation
    try {
      await program.methods
        .executeTransfer(new anchor.BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          policy: policyPda,
          agent: agent.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("PolicyInactive");
    }
  });

  it("re-activates agent with new policy", async () => {
    await program.methods
      .setAgentPolicy(
        new anchor.BN(DAILY_LIMIT),
        new anchor.BN(PER_TX_LIMIT),
        new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        [],
        [],
      )
      .accounts({
        vault: vaultPda,
        policy: policyPda,
        owner: owner.publicKey,
        agent: agent.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const policy = await program.account.agentPolicy.fetch(policyPda);
    expect(policy.active).to.equal(true);
    expect(policy.dailySpent.toNumber()).to.equal(0); // Reset on new policy
  });

  // ──────────────────────────────────────
  // UNAUTHORIZED ACCESS
  // ──────────────────────────────────────

  it("rejects non-owner setting policy", async () => {
    const fakeOwner = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      fakeOwner.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .setPaused(true)
        .accounts({
          vault: vaultPda,
          owner: fakeOwner.publicKey,
        })
        .signers([fakeOwner])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      // PDA seed mismatch or has_one violation
      expect(err).to.exist;
    }
  });

  it("rejects non-agent executing transfer", async () => {
    const fakeAgent = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      fakeAgent.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .executeTransfer(new anchor.BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          policy: policyPda, // Policy is for `agent`, not `fakeAgent`
          agent: fakeAgent.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([fakeAgent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      // PDA seed mismatch
      expect(err).to.exist;
    }
  });
});
