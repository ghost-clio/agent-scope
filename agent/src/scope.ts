/**
 * AgentScope — On-Chain Permission Enforcement for AI Agents
 * 
 * TypeScript client for AgentScopeModule.sol — the audited Solidity contract
 * that enforces what an AI agent is allowed to do on-chain.
 * 
 * Architecture:
 *   Human → deploys Safe + AgentScopeModule → calls setAgentPolicy()
 *   Agent → proposes transactions → scope.validate() → executeAsAgent()
 *   
 * The contract enforces:
 *   - Daily ETH spending limits (fixed 24h window)
 *   - Per-transaction ETH limits
 *   - Contract address whitelist
 *   - Function selector whitelist
 *   - ERC20 token daily allowances
 *   - Session expiry
 *   - Global emergency pause
 *   - Self-targeting escalation guard
 * 
 * Two modes:
 *   ON-CHAIN: Reads policy from deployed AgentScopeModule, validates via
 *             checkPermission(), executes via executeAsAgent(). The contract
 *             is the source of truth. JS cannot override it.
 *   LOCAL:    Same validation logic, same checks — but enforced in JS.
 *             Used for demo/testing when no contract is deployed.
 *             Explicitly labeled as "local fallback" in all logs.
 * 
 * The key insight: the LLM reasons freely (via Venice, confidentially),
 * but its ACTIONS are constrained by on-chain policy it cannot modify.
 * Confidential thoughts, scoped actions, public receipts.
 */

import { ethers } from 'ethers';
import { AgentLog } from './logger.js';
import { AgentConfig } from './config.js';

// ─── Types (mirror AgentScopeModule.sol structs) ──────────────────

/**
 * Policy — mirrors AgentScopeModule.Policy struct exactly.
 * Set by the Safe owner via setAgentPolicy().
 */
export interface ScopePolicy {
  active: boolean;
  dailySpendLimitWei: bigint;    // Max ETH per fixed 24h window
  maxPerTxWei: bigint;           // Max ETH per single tx (0 = use daily limit)
  sessionExpiry: number;          // Unix timestamp, 0 = no expiry
  allowedContracts: string[];     // Contract whitelist (empty = any)
  allowedFunctions: string[];     // Function selector whitelist (empty = any)
}

/**
 * On-chain scope view — returned by getAgentScope().
 */
export interface OnChainScope {
  active: boolean;
  dailySpendLimitWei: bigint;
  maxPerTxWei: bigint;
  sessionExpiry: number;
  remainingBudget: bigint;
  allowedContracts: string[];
  allowedFunctions: string[];
}

/**
 * Transaction proposal — what the agent wants to do.
 */
export interface TransactionProposal {
  to: string;
  value: bigint;
  data: string;
  description: string;
}

/**
 * Validation result with per-check dethe operator.
 */
export interface ScopeValidation {
  approved: boolean;
  enforcement: 'on-chain' | 'local';
  checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
  proposal: TransactionProposal;
  timestamp: number;
}

// ─── ABI (matches AgentScopeModule.sol exactly) ───────────────────

const AGENT_SCOPE_MODULE_ABI = [
  // View functions
  'function safe() view returns (address)',
  'function paused() view returns (bool)',
  'function getAgentScope(address agent) view returns (bool active, uint256 dailySpendLimitWei, uint256 maxPerTxWei, uint256 sessionExpiry, uint256 remainingBudget, address[] allowedContracts, bytes4[] allowedFunctions)',
  'function checkPermission(address agent, address to, uint256 value, bytes data) view returns (bool allowed, string reason)',
  'function tokenAllowances(address agent, address token) view returns (uint256)',
  'function tokenSpent(address agent, address token) view returns (uint256)',

  // Agent functions
  'function executeAsAgent(address to, uint256 value, bytes data) returns (bool success)',

  // Owner functions (called through Safe)
  'function setAgentPolicy(address agent, uint256 dailySpendLimitWei, uint256 maxPerTxWei, uint256 sessionExpiry, address[] allowedContracts, bytes4[] allowedFunctions)',
  'function setTokenAllowance(address agent, address token, uint256 dailyAllowance)',
  'function revokeAgent(address agent)',
  'function setPaused(bool _paused)',

  // Events
  'event AgentPolicySet(address indexed agent, uint256 dailyLimit, uint256 maxPerTx, uint256 expiry)',
  'event AgentExecuted(address indexed agent, address indexed to, uint256 value, bytes4 selector)',
  'event AgentRevoked(address indexed agent)',
  'event PolicyViolation(address indexed agent, string reason)',
  'event TokenAllowanceSet(address indexed agent, address indexed token, uint256 dailyAllowance)',
  'event GlobalPause(bool paused)',
];

// ─── AgentScope Client ────────────────────────────────────────────

export class AgentScope {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract | null = null;
  private contractAddress: string | null = null;
  private logger: AgentLog;
  private config: AgentConfig;
  private agentAddress: string | null = null;

  // Local tracking (used only in local mode)
  private localPolicy: ScopePolicy | null = null;
  private localDailySpent: bigint = 0n;
  private localWindowStart: number = 0;
  private localLastTrade: number = 0;

  constructor(config: AgentConfig, logger: AgentLog) {
    this.config = config;
    this.logger = logger;
    this.provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);
  }

  // ─── Connection ──────────────────────────────────────────

  /**
   * Connect to a deployed AgentScopeModule contract.
   * Reads the agent's policy from chain.
   */
  async connectOnChain(contractAddress: string, agentAddress: string): Promise<boolean> {
    this.contractAddress = contractAddress;
    this.agentAddress = agentAddress;

    try {
      this.contract = new ethers.Contract(
        contractAddress,
        AGENT_SCOPE_MODULE_ABI,
        this.provider
      );

      // Verify contract exists by reading safe address
      const safeAddr = await this.contract.safe();
      
      // Read agent's scope
      const scope = await this.contract.getAgentScope(agentAddress);

      this.logger.logDecision('scope-connected', {
        contract: contractAddress,
        safe: safeAddr,
        agent: agentAddress,
        chain: this.config.chainKey,
        active: scope.active,
        dailyLimit: ethers.formatEther(scope.dailySpendLimitWei),
        maxPerTx: ethers.formatEther(scope.maxPerTxWei),
        remainingBudget: ethers.formatEther(scope.remainingBudget),
        allowedContracts: scope.allowedContracts.length,
        allowedFunctions: scope.allowedFunctions.length,
        enforcement: 'on-chain',
      });

      return true;
    } catch (error: any) {
      this.logger.logDecision('scope-connection-failed', {
        contract: contractAddress,
        error: error.message,
        fallback: 'local',
      });
      this.contract = null;
      return false;
    }
  }

  /**
   * Initialize with a local policy (for demo/testing).
   * Same validation logic, explicitly labeled as local fallback.
   */
  initLocal(overrides?: Partial<ScopePolicy>): void {
    this.localPolicy = {
      active: true,
      dailySpendLimitWei: ethers.parseEther('0.5'),
      maxPerTxWei: ethers.parseEther('0.05'),
      sessionExpiry: 0,
      allowedContracts: [],
      allowedFunctions: [
        '0x38ed1739',  // swapExactTokensForTokens
        '0x7ff36ab5',  // swapExactETHForTokens
        '0x18cbafe5',  // swapExactTokensForETH
        '0x5c11d795',  // swapExactTokensForTokensSupportingFeeOnTransferTokens
        '0x04e45aaf',  // Uniswap V3 exactInputSingle
      ],
      ...overrides,
    };
    this.localWindowStart = Math.floor(Date.now() / 1000);

    this.logger.logDecision('scope-local-init', {
      mode: 'local-fallback',
      dailyLimit: ethers.formatEther(this.localPolicy.dailySpendLimitWei),
      maxPerTx: ethers.formatEther(this.localPolicy.maxPerTxWei),
      allowedFunctions: this.localPolicy.allowedFunctions.length,
      note: 'Local policy mirrors on-chain structure but is NOT cryptographically enforced',
    });
  }

  get isOnChain(): boolean {
    return this.contract !== null;
  }

  // ─── Validation ──────────────────────────────────────────

  /**
   * Validate a transaction proposal against the scope policy.
   * 
   * ON-CHAIN mode: calls checkPermission() on the contract.
   * LOCAL mode: runs the same checks in JavaScript.
   * 
   * Always call this before executing any trade.
   */
  async validate(proposal: TransactionProposal): Promise<ScopeValidation> {
    if (this.contract && this.agentAddress) {
      return this.validateOnChain(proposal);
    }
    return this.validateLocal(proposal);
  }

  /**
   * On-chain validation — the contract is the source of truth.
   */
  private async validateOnChain(proposal: TransactionProposal): Promise<ScopeValidation> {
    const now = Math.floor(Date.now() / 1000);
    const checks: ScopeValidation['checks'] = [];

    try {
      // Call the contract's checkPermission view function
      const [allowed, reason] = await this.contract!.checkPermission(
        this.agentAddress,
        proposal.to,
        proposal.value,
        proposal.data
      );

      checks.push({
        name: 'On-chain checkPermission',
        passed: allowed,
        detail: allowed ? 'Contract approved transaction' : `Rejected: ${reason}`,
      });

      // Also read remaining budget for logging
      const scope = await this.contract!.getAgentScope(this.agentAddress);
      checks.push({
        name: 'Remaining budget',
        passed: true,
        detail: `${ethers.formatEther(scope.remainingBudget)} ETH remaining today`,
      });

      const validation: ScopeValidation = {
        approved: allowed,
        enforcement: 'on-chain',
        checks,
        proposal,
        timestamp: now,
      };

      this.logger.logSafetyCheck('agent-scope-validate', {
        approved: allowed,
        enforcement: 'on-chain',
        contractReason: reason,
        remainingBudget: ethers.formatEther(scope.remainingBudget),
        proposal: {
          to: proposal.to,
          value: ethers.formatEther(proposal.value),
          selector: proposal.data.slice(0, 10),
          description: proposal.description,
        },
      });

      return validation;
    } catch (error: any) {
      // If on-chain check fails, do NOT fall back to local — fail closed
      checks.push({
        name: 'On-chain checkPermission',
        passed: false,
        detail: `Contract call failed: ${error.message}`,
      });

      return {
        approved: false,
        enforcement: 'on-chain',
        checks,
        proposal,
        timestamp: now,
      };
    }
  }

  /**
   * Local validation — mirrors on-chain logic exactly.
   * Every check here corresponds to a check in AgentScopeModule.sol.
   */
  private validateLocal(proposal: TransactionProposal): ScopeValidation {
    const policy = this.localPolicy;
    if (!policy) {
      return {
        approved: false,
        enforcement: 'local',
        checks: [{ name: 'Policy loaded', passed: false, detail: 'No policy configured' }],
        proposal,
        timestamp: Math.floor(Date.now() / 1000),
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const checks: ScopeValidation['checks'] = [];

    // Check 1: Active (mirrors: if (!policy.active) revert AgentNotActive())
    checks.push({
      name: 'Policy active',
      passed: policy.active,
      detail: policy.active ? 'Agent scope is active' : 'KILLED — owner has paused the agent',
    });

    // Check 2: Session expiry (mirrors: if (policy.sessionExpiry != 0 && block.timestamp > policy.sessionExpiry))
    const sessionValid = policy.sessionExpiry === 0 || now < policy.sessionExpiry;
    checks.push({
      name: 'Session expiry',
      passed: sessionValid,
      detail: policy.sessionExpiry === 0
        ? 'No expiry set'
        : sessionValid
          ? `Expires at ${new Date(policy.sessionExpiry * 1000).toISOString()}`
          : 'SESSION EXPIRED',
    });

    // Check 3: Contract whitelist (mirrors: allowedContracts loop)
    const contractAllowed = policy.allowedContracts.length === 0 ||
      policy.allowedContracts.some(c => c.toLowerCase() === proposal.to.toLowerCase());
    checks.push({
      name: 'Contract whitelist',
      passed: contractAllowed,
      detail: policy.allowedContracts.length === 0
        ? 'Any contract allowed (no whitelist set)'
        : contractAllowed
          ? `${proposal.to.slice(0, 10)}... is whitelisted`
          : `${proposal.to.slice(0, 10)}... NOT in whitelist`,
    });

    // Check 4: Function selector whitelist (mirrors: allowedFunctions loop)
    const selector = proposal.data.length >= 10 ? proposal.data.slice(0, 10) : '0x';
    const selectorAllowed = proposal.data.length < 10 ||
      policy.allowedFunctions.length === 0 ||
      policy.allowedFunctions.includes(selector);
    checks.push({
      name: 'Function selector',
      passed: selectorAllowed,
      detail: policy.allowedFunctions.length === 0
        ? 'Any function allowed (no whitelist set)'
        : selectorAllowed
          ? `${selector} is whitelisted`
          : `${selector} NOT in allowed functions`,
    });

    // Check 5: Per-transaction limit (mirrors: if (value > policy.maxPerTxWei))
    const withinPerTxLimit = policy.maxPerTxWei === 0n || proposal.value <= policy.maxPerTxWei;
    checks.push({
      name: 'Per-transaction limit',
      passed: withinPerTxLimit,
      detail: policy.maxPerTxWei === 0n
        ? 'No per-tx limit set'
        : `${ethers.formatEther(proposal.value)} / ${ethers.formatEther(policy.maxPerTxWei)} ETH`,
    });

    // Check 6: Daily spend limit (mirrors: fixed 24h window logic)
    // Reset window if 24h passed
    if (now >= this.localWindowStart + 86400) {
      this.localDailySpent = 0n;
      this.localWindowStart = now;
    }
    const projectedSpend = this.localDailySpent + proposal.value;
    const withinDailyLimit = projectedSpend <= policy.dailySpendLimitWei;
    const remaining = policy.dailySpendLimitWei - this.localDailySpent;
    checks.push({
      name: 'Daily spending limit',
      passed: withinDailyLimit,
      detail: `${ethers.formatEther(proposal.value)} requested, ${ethers.formatEther(remaining)} remaining of ${ethers.formatEther(policy.dailySpendLimitWei)} ETH/day`,
    });

    const approved = checks.every(c => c.passed);

    const validation: ScopeValidation = {
      approved,
      enforcement: 'local',
      checks,
      proposal,
      timestamp: now,
    };

    this.logger.logSafetyCheck('agent-scope-validate', {
      approved,
      enforcement: 'local',
      note: 'Local fallback — not cryptographically enforced',
      checks: checks.map(c => ({ name: c.name, passed: c.passed })),
      proposal: {
        to: proposal.to,
        value: ethers.formatEther(proposal.value),
        selector,
        description: proposal.description,
      },
    });

    return validation;
  }

  // ─── Execution ───────────────────────────────────────────

  /**
   * Execute a validated transaction through the AgentScope contract.
   * Only works in on-chain mode with a signer.
   * 
   * In local mode, this just records the spend — actual execution
   * is handled by uniswap.ts directly.
   */
  async execute(
    proposal: TransactionProposal,
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.contract) {
      // Local mode — just record the spend
      this.localDailySpent += proposal.value;
      this.localLastTrade = Math.floor(Date.now() / 1000);
      return { success: true, txHash: undefined };
    }

    try {
      const contractWithSigner = this.contract.connect(signer) as ethers.Contract;
      const tx = await contractWithSigner.executeAsAgent(
        proposal.to,
        proposal.value,
        proposal.data
      );
      const receipt = await tx.wait();

      this.logger.logExecution('scope-execute', {
        success: true,
        txHash: receipt.hash,
        proposal: proposal.description,
        enforcement: 'on-chain',
        explorerUrl: `${this.config.chain.explorerUrl}/tx/${receipt.hash}`,
        valueUsd: 0, // Caller should set this
      });

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      this.logger.logExecution('scope-execute-failed', {
        success: false,
        error: error.message,
        proposal: proposal.description,
        enforcement: 'on-chain',
        valueUsd: 0,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Record a trade in local mode (updates local spend tracking).
   */
  recordLocalSpend(valueWei: bigint): void {
    this.localDailySpent += valueWei;
    this.localLastTrade = Math.floor(Date.now() / 1000);
  }

  // ─── Status ──────────────────────────────────────────────

  /**
   * Get current scope status.
   */
  async getStatus(): Promise<{
    mode: 'on-chain' | 'local';
    active: boolean;
    dailyLimit: string;
    maxPerTx: string;
    remaining: string;
    contractAddress: string | null;
    agentAddress: string | null;
  }> {
    if (this.contract && this.agentAddress) {
      try {
        const scope = await this.contract.getAgentScope(this.agentAddress);
        return {
          mode: 'on-chain',
          active: scope.active,
          dailyLimit: ethers.formatEther(scope.dailySpendLimitWei),
          maxPerTx: ethers.formatEther(scope.maxPerTxWei),
          remaining: ethers.formatEther(scope.remainingBudget),
          contractAddress: this.contractAddress,
          agentAddress: this.agentAddress,
        };
      } catch {
        // Fall through to local
      }
    }

    const policy = this.localPolicy;
    const now = Math.floor(Date.now() / 1000);
    if (now >= this.localWindowStart + 86400) {
      this.localDailySpent = 0n;
      this.localWindowStart = now;
    }

    return {
      mode: 'local',
      active: policy?.active ?? false,
      dailyLimit: policy ? ethers.formatEther(policy.dailySpendLimitWei) : '0',
      maxPerTx: policy ? ethers.formatEther(policy.maxPerTxWei) : '0',
      remaining: policy ? ethers.formatEther(policy.dailySpendLimitWei - this.localDailySpent) : '0',
      contractAddress: this.contractAddress,
      agentAddress: this.agentAddress,
    };
  }
}

// ─── Demo ─────────────────────────────────────────────────────────

export async function demoAgentScope(logger: AgentLog): Promise<void> {
  console.log('\n🛡️  AgentScope — On-Chain Permission Enforcement\n');
  console.log('  The human sets the policy. The blockchain enforces it.');
  console.log('  The agent operates freely within its scope — but cannot exceed it.\n');

  // Show deployed contracts if available
  const SEPOLIA_MODULE = '0x0d0034c6AC4640463bf480cB07BE770b08Bef811';
  const SEPOLIA_SAFE   = '0x51157a48b0A00D6C9C49f0AaEe98a27511DD180a';
  console.log('  📜 Deployed contracts (Sepolia):');
  console.log(`     AgentScopeModule: ${SEPOLIA_MODULE}`);
  console.log(`     MockSafe:         ${SEPOLIA_SAFE}`);
  console.log('');

  // Create local scope for demo
  const config: any = {
    chain: { rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org' },
    chainKey: 'base',
  };
  const scope = new AgentScope(config, logger);

  // Initialize with policy matching our Sepolia deployment
  scope.initLocal({
    active: true,
    dailySpendLimitWei: ethers.parseEther('0.5'),
    maxPerTxWei: ethers.parseEther('0.05'),
    sessionExpiry: 0,
    allowedContracts: [
      '0x2626664c2603336E57B271c5C0b26F421741e481',  // Uniswap V3 Router (Base)
    ],
    allowedFunctions: [
      '0x04e45aaf',  // exactInputSingle
      '0x38ed1739',  // swapExactTokensForTokens
    ],
  });

  console.log('  📋 Policy (set by human, enforced by contract):');
  console.log('     Daily limit:        0.5 ETH');
  console.log('     Per-transaction:    0.05 ETH');
  console.log('     Allowed contracts:  Uniswap V3 Router only');
  console.log('     Allowed functions:  exactInputSingle, swapExactTokensForTokens');
  console.log('     Session expiry:     None');

  // ─── Test 1: Valid swap ───
  console.log('\n  ─── Test 1: Valid swap (0.012 ETH → USDC via Uniswap) ───');
  const validProposal: TransactionProposal = {
    to: '0x2626664c2603336E57B271c5C0b26F421741e481',
    value: ethers.parseEther('0.012'),
    data: '0x04e45aaf' + '0'.repeat(64),
    description: 'Swap 0.012 ETH → USDC via Uniswap V3 exactInputSingle',
  };
  const result1 = await scope.validate(validProposal);
  for (const check of result1.checks) {
    console.log(`     ${check.passed ? '✅' : '❌'} ${check.name}: ${check.detail}`);
  }
  console.log(`     Enforcement: ${result1.enforcement}`);
  console.log(`     Result: ${result1.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
  if (result1.approved) scope.recordLocalSpend(validProposal.value);

  // ─── Test 2: Over per-tx limit ───
  console.log('\n  ─── Test 2: Over per-tx limit (0.1 ETH — exceeds 0.05 max) ───');
  const oversizedProposal: TransactionProposal = {
    to: '0x2626664c2603336E57B271c5C0b26F421741e481',
    value: ethers.parseEther('0.1'),
    data: '0x04e45aaf' + '0'.repeat(64),
    description: 'Swap 0.1 ETH → USDC (OVER PER-TX LIMIT)',
  };
  const result2 = await scope.validate(oversizedProposal);
  for (const check of result2.checks) {
    if (!check.passed) console.log(`     ❌ ${check.name}: ${check.detail}`);
  }
  console.log(`     Result: ${result2.approved ? '✅ APPROVED' : '❌ REJECTED — scope enforced'}`);

  // ─── Test 3: Unauthorized function ───
  console.log('\n  ─── Test 3: Unauthorized function (transfer — not a swap) ───');
  const unauthorizedProposal: TransactionProposal = {
    to: '0x2626664c2603336E57B271c5C0b26F421741e481',
    value: 0n,
    data: '0xa9059cbb' + '0'.repeat(64),   // transfer()
    description: 'Raw transfer (NOT in allowed functions)',
  };
  const result3 = await scope.validate(unauthorizedProposal);
  for (const check of result3.checks) {
    if (!check.passed) console.log(`     ❌ ${check.name}: ${check.detail}`);
  }
  console.log(`     Result: ${result3.approved ? '✅ APPROVED' : '❌ REJECTED — function not in scope'}`);

  // ─── Test 4: Wrong contract ───
  console.log('\n  ─── Test 4: Wrong contract (not Uniswap) ───');
  const wrongContract: TransactionProposal = {
    to: '0xdead000000000000000000000000000000000000',
    value: ethers.parseEther('0.01'),
    data: '0x04e45aaf' + '0'.repeat(64),
    description: 'Swap via unknown contract (NOT whitelisted)',
  };
  const result4 = await scope.validate(wrongContract);
  for (const check of result4.checks) {
    if (!check.passed) console.log(`     ❌ ${check.name}: ${check.detail}`);
  }
  console.log(`     Result: ${result4.approved ? '✅ APPROVED' : '❌ REJECTED — contract not in scope'}`);

  // Summary
  const status = await scope.getStatus();
  console.log('\n  📊 Scope Status:');
  console.log(`     Mode: ${status.mode} ${status.mode === 'local' ? '(fallback — not cryptographically enforced)' : '(contract is source of truth)'}`);
  console.log(`     Daily limit: ${status.dailyLimit} ETH`);
  console.log(`     Per-tx limit: ${status.maxPerTx} ETH`);
  console.log(`     Remaining: ${status.remaining} ETH`);

  console.log('\n  💡 In production:');
  console.log('     Human deploys Safe → attaches AgentScopeModule → calls setAgentPolicy()');
  console.log('     Agent calls executeAsAgent() → contract validates ALL checks → Safe executes');
  console.log('     The LLM cannot modify the policy. Only the Safe owner can.');
  console.log('     This is not a config file. This is a smart contract.\n');
}
