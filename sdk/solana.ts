/**
 * AgentScope Solana SDK — TypeScript client for the Anchor program
 *
 * Provides the same API surface as the EVM SDK but for Solana:
 * - Vault initialization + funding
 * - Policy management (set, update, revoke)
 * - Scoped execution (transfer, CPI)
 * - Permission checks + scope queries
 * - Token allowances (SPL)
 *
 * @author clio_ghost
 */

import {
  type Connection,
  type Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type TransactionSignature,
} from "@solana/web3.js";
import { type Program, type AnchorProvider, BN } from "@coral-xyz/anchor";

// ═══════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════

const PROGRAM_ID = new PublicKey("7K6qSQKWBh3sNzAnQADJMcGvAx6zMALGnPvhxhFoV8GK");

// ═══════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════

export interface AgentPolicyData {
  active: boolean;
  dailyLimitLamports: bigint;
  perTxLimitLamports: bigint;
  sessionExpiry: number;
  allowedPrograms: PublicKey[];
  allowedDiscriminators: number[][];
  dailySpent: bigint;
  remaining: bigint;
  lastReset: number;
}

export interface SetPolicyParams {
  /** Agent public key */
  agent: PublicKey;
  /** Daily spend limit in lamports */
  dailyLimitLamports: bigint | number;
  /** Per-transaction limit in lamports */
  perTxLimitLamports: bigint | number;
  /** Unix timestamp for session expiry */
  sessionExpiry: number;
  /** Allowed program IDs (empty = allow all) */
  allowedPrograms?: PublicKey[];
  /** Allowed instruction discriminators (empty = allow all) */
  allowedDiscriminators?: number[][];
}

export interface TransferResult {
  signature: TransactionSignature;
  amount: bigint;
  dailySpent: bigint;
}

// ═══════════════════════════════════════════════════════
//  PDA Derivation
// ═══════════════════════════════════════════════════════

function deriveVaultPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), owner.toBuffer()],
    PROGRAM_ID,
  );
}

function derivePolicyPda(vault: PublicKey, agent: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), vault.toBuffer(), agent.toBuffer()],
    PROGRAM_ID,
  );
}

function deriveTokenAllowancePda(
  vault: PublicKey,
  agent: PublicKey,
  mint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_allowance"), vault.toBuffer(), agent.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  );
}

// ═══════════════════════════════════════════════════════
//  SDK Class
// ═══════════════════════════════════════════════════════

export class AgentScopeSolana {
  private program: Program;
  private connection: Connection;
  private vaultPda: PublicKey;
  private vaultBump: number;
  private owner: PublicKey;

  constructor(opts: {
    program: Program;
    owner: PublicKey;
  }) {
    this.program = opts.program;
    this.connection = opts.program.provider.connection;
    this.owner = opts.owner;
    [this.vaultPda, this.vaultBump] = deriveVaultPda(opts.owner);
  }

  // ─── Static helpers ───

  static programId(): PublicKey {
    return PROGRAM_ID;
  }

  static deriveVault(owner: PublicKey): PublicKey {
    return deriveVaultPda(owner)[0];
  }

  static derivePolicy(vault: PublicKey, agent: PublicKey): PublicKey {
    return derivePolicyPda(vault, agent)[0];
  }

  // ─── Vault lifecycle ───

  get vault(): PublicKey {
    return this.vaultPda;
  }

  async initializeVault(): Promise<TransactionSignature> {
    return this.program.methods
      .initializeVault()
      .accounts({
        vault: this.vaultPda,
        owner: this.owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async fundVault(amountLamports: bigint | number): Promise<TransactionSignature> {
    return this.program.methods
      .fundVault(new BN(amountLamports.toString()))
      .accounts({
        vault: this.vaultPda,
        funder: this.owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async getVaultBalance(): Promise<bigint> {
    const bal = await this.connection.getBalance(this.vaultPda);
    return BigInt(bal);
  }

  // ─── Policy management (owner) ───

  async setPolicy(params: SetPolicyParams): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, params.agent);

    return this.program.methods
      .setAgentPolicy(
        new BN(params.dailyLimitLamports.toString()),
        new BN(params.perTxLimitLamports.toString()),
        new BN(params.sessionExpiry),
        params.allowedPrograms ?? [],
        params.allowedDiscriminators ?? [],
      )
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        owner: this.owner,
        agent: params.agent,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async updatePolicy(params: SetPolicyParams): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, params.agent);

    return this.program.methods
      .updatePolicy(
        new BN(params.dailyLimitLamports.toString()),
        new BN(params.perTxLimitLamports.toString()),
        new BN(params.sessionExpiry),
        params.allowedPrograms ?? [],
        params.allowedDiscriminators ?? [],
      )
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        owner: this.owner,
      })
      .rpc();
  }

  async revokeAgent(agent: PublicKey): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, agent);

    return this.program.methods
      .revokeAgent()
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        owner: this.owner,
      })
      .rpc();
  }

  async setPaused(paused: boolean): Promise<TransactionSignature> {
    return this.program.methods
      .setPaused(paused)
      .accounts({
        vault: this.vaultPda,
        owner: this.owner,
      })
      .rpc();
  }

  async setTokenAllowance(
    agent: PublicKey,
    tokenMint: PublicKey,
    dailyLimit: bigint | number,
  ): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, agent);
    const [tokenPda] = deriveTokenAllowancePda(this.vaultPda, agent, tokenMint);

    return this.program.methods
      .setTokenAllowance(tokenMint, new BN(dailyLimit.toString()))
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        tokenAllowance: tokenPda,
        owner: this.owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ─── Agent execution ───

  async executeTransfer(
    agent: PublicKey,
    recipient: PublicKey,
    amountLamports: bigint | number,
  ): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, agent);

    return this.program.methods
      .executeTransfer(new BN(amountLamports.toString()))
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        agent,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async executeCpi(
    agent: PublicKey,
    targetProgram: PublicKey,
    instructionData: Buffer,
    solAmount: bigint | number = 0,
  ): Promise<TransactionSignature> {
    const [policyPda] = derivePolicyPda(this.vaultPda, agent);

    return this.program.methods
      .executeCpi(targetProgram, instructionData, new BN(solAmount.toString()))
      .accounts({
        vault: this.vaultPda,
        policy: policyPda,
        agent,
      })
      .rpc();
  }

  // ─── Queries ───

  async getScope(agent: PublicKey): Promise<AgentPolicyData | null> {
    const [policyPda] = derivePolicyPda(this.vaultPda, agent);

    try {
      const account = await this.program.account.agentPolicy.fetch(policyPda);
      const now = Math.floor(Date.now() / 1000);
      const dailyLimit = BigInt(account.dailyLimitLamports.toString());
      const dailySpent = BigInt(account.dailySpent.toString());

      // Check if daily window reset
      const lastReset = Number(account.lastReset.toString());
      const effectiveSpent = now - lastReset >= 86400 ? 0n : dailySpent;

      return {
        active: account.active,
        dailyLimitLamports: dailyLimit,
        perTxLimitLamports: BigInt(account.perTxLimitLamports.toString()),
        sessionExpiry: Number(account.sessionExpiry.toString()),
        allowedPrograms: account.allowedPrograms,
        allowedDiscriminators: account.allowedDiscriminators,
        dailySpent: effectiveSpent,
        remaining: dailyLimit - effectiveSpent,
        lastReset,
      };
    } catch {
      return null; // No policy set
    }
  }

  async checkPermission(
    agent: PublicKey,
    amount: bigint | number,
    targetProgram?: PublicKey,
    discriminator?: number[],
  ): Promise<{ allowed: boolean; reason?: string }> {
    const scope = await this.getScope(agent);
    if (!scope) return { allowed: false, reason: "No policy set" };
    if (!scope.active) return { allowed: false, reason: "Policy inactive" };

    const now = Math.floor(Date.now() / 1000);
    if (scope.sessionExpiry > 0 && now > scope.sessionExpiry) {
      return { allowed: false, reason: "Session expired" };
    }

    const amt = BigInt(amount.toString());
    if (scope.perTxLimitLamports > 0n && amt > scope.perTxLimitLamports) {
      return { allowed: false, reason: `Per-tx limit exceeded (${amt} > ${scope.perTxLimitLamports})` };
    }
    if (scope.dailyLimitLamports > 0n && scope.dailySpent + amt > scope.dailyLimitLamports) {
      return { allowed: false, reason: `Daily limit exceeded (${scope.dailySpent + amt} > ${scope.dailyLimitLamports})` };
    }

    if (targetProgram && scope.allowedPrograms.length > 0) {
      const allowed = scope.allowedPrograms.some((p) => p.equals(targetProgram));
      if (!allowed) return { allowed: false, reason: "Program not in whitelist" };
    }

    return { allowed: true };
  }

  // ─── Formatting helpers ───

  static formatSol(lamports: bigint): string {
    const sol = Number(lamports) / LAMPORTS_PER_SOL;
    return `${sol.toFixed(4)} SOL`;
  }

  async getStatusPrompt(agent: PublicKey): Promise<string> {
    const scope = await this.getScope(agent);
    if (!scope) return "No AgentScope policy set for this agent.";
    if (!scope.active) return "AgentScope policy is REVOKED. No transactions allowed.";

    const lines = [
      `AgentScope Status:`,
      `  Daily limit: ${AgentScopeSolana.formatSol(scope.dailyLimitLamports)}`,
      `  Spent today: ${AgentScopeSolana.formatSol(scope.dailySpent)}`,
      `  Remaining:   ${AgentScopeSolana.formatSol(scope.remaining)}`,
      `  Per-tx max:  ${AgentScopeSolana.formatSol(scope.perTxLimitLamports)}`,
    ];

    if (scope.sessionExpiry > 0) {
      const remaining = scope.sessionExpiry - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        lines.push(`  Session: EXPIRED`);
      } else {
        const hours = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        lines.push(`  Session: ${hours}h ${mins}m remaining`);
      }
    }

    if (scope.allowedPrograms.length > 0) {
      lines.push(`  Allowed programs: ${scope.allowedPrograms.length}`);
    } else {
      lines.push(`  Allowed programs: ANY`);
    }

    return lines.join("\n");
  }
}

// ─── Convenience exports ───
export { deriveVaultPda, derivePolicyPda, deriveTokenAllowancePda, PROGRAM_ID };
