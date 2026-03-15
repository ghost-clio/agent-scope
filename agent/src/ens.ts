/**
 * ENS ↔ ERC-8004 Identity Bridge
 * 
 * The missing link between human-readable names and agent identity.
 * 
 * Problem:
 *   - ERC-8004 gives agents verifiable on-chain identity → but they're hex IDs
 *   - ENS gives human-readable names → but doesn't know what an "agent" is
 *   - Agents can't discover or verify each other by name
 * 
 * Solution: ERC8004ENSBridge contract + this TypeScript client
 *   - Agents register their ERC-8004 identity against their ENS name
 *   - Other agents resolve names to verified identities
 *   - Reverse lookup: participantId → ENS name
 *   - Trust assessment before agent-to-agent transactions
 * 
 * Two modes:
 *   ON-CHAIN: Reads from deployed ERC8004ENSBridge contract
 *   ENS-NATIVE: Reads erc8004.* text records directly from ENS resolver
 *   (Both work. Contract is richer; text records are simpler to set up.)
 * 
 * Proposed convention for ERC-8004 text records in ENS:
 *   erc8004.participantId  — agent's ERC-8004 participant ID
 *   erc8004.chain          — chain where identity lives (e.g., "base")
 *   erc8004.manifest       — URL to agent.json manifest
 *   erc8004.registrationTxn — registration transaction hash
 *   erc8004.capabilities   — comma-separated capability list
 * 
 * This is a proposed standard — no existing bridge between ENS and ERC-8004.
 * Ghost Protocol is the first implementation.
 * 
 * Built by Clio 🌀
 */

import { ethers } from 'ethers';
import { AgentLog } from './logger.js';

// ─── Types ────────────────────────────────────────────────────────

export interface ERC8004Identity {
  participantId: string;
  chain: string;
  manifest?: string;
  registrationTxn?: string;
  capabilities?: string[];
  name?: string;           // ENS name (if resolved)
  address?: string;        // Ethereum address
  verified: boolean;       // Whether cross-chain verification passed
  verificationMethod?: 'bridge-contract' | 'text-record' | 'l2-tx-receipt';
}

export interface ENSAgentRecord {
  ensName: string;
  address: string | null;
  avatar?: string;
  description?: string;
  url?: string;
  erc8004?: ERC8004Identity;
  rawTextRecords: Record<string, string>;
  resolvedVia: 'bridge-contract' | 'ens-text-records' | 'both';
}

export interface TrustAssessment {
  trustLevel: 'high' | 'medium' | 'low' | 'unknown';
  score: number;           // 0-100
  reasons: string[];
  identity: ENSAgentRecord | null;
  timestamp: number;
}

export interface ENSBridgeConfig {
  ethereumRpcUrl: string;
  baseRpcUrl: string;
  bridgeContractAddress?: string;  // ERC8004ENSBridge on L1
}

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_ETH_RPC = 'https://eth.llamarpc.com';
const DEFAULT_BASE_RPC = 'https://mainnet.base.org';

// ERC-8004 text record keys (proposed convention)
const ERC8004_TEXT_KEYS = {
  participantId: 'erc8004.participantId',
  chain: 'erc8004.chain',
  manifest: 'erc8004.manifest',
  registrationTxn: 'erc8004.registrationTxn',
  capabilities: 'erc8004.capabilities',
} as const;

// Standard ENS text record keys
const STANDARD_KEYS = ['avatar', 'description', 'url', 'com.twitter', 'com.github'];

// ERC8004ENSBridge ABI (matches deployed contract)
const BRIDGE_ABI = [
  'function resolveAgent(bytes32 ensNode) view returns (bool active, bytes16 participantId, uint256 l2ChainId, bytes32 registrationTxHash, string manifestUri, string ensName)',
  'function lookupByParticipantId(bytes16 participantId) view returns (bool found, string ensName, uint256 l2ChainId, string manifestUri)',
  'function getCapabilities(bytes32 ensNode) view returns (tuple(string name, string version, string description)[])',
  'function totalRegistered() view returns (uint256)',
  'function registerIdentity(bytes32 ensNode, string ensName, bytes16 participantId, uint256 l2ChainId, bytes32 regTxHash, string manifestUri) payable',
  'function updateManifest(bytes32 ensNode, string manifestUri)',
  'function addCapability(bytes32 ensNode, string name, string version, string description)',
  'function clearCapabilities(bytes32 ensNode)',
  'function deactivate(bytes32 ensNode)',
  'function reactivate(bytes32 ensNode)',
  'function registrationFee() view returns (uint256)',
  'event IdentityLinked(bytes32 indexed ensNode, bytes16 indexed participantId, string ensName, uint256 l2ChainId, address registrant)',
  'event CapabilityAdded(bytes32 indexed ensNode, string name, string version)',
];

// ─── ENS Bridge Client ───────────────────────────────────────────

export class ENSBridge {
  private ethProvider: ethers.JsonRpcProvider;
  private baseProvider: ethers.JsonRpcProvider;
  private bridgeContract: ethers.Contract | null = null;
  private logger: AgentLog | null;
  private cache: Map<string, { record: ENSAgentRecord; timestamp: number }> = new Map();
  private cacheTtlMs = 5 * 60 * 1000; // 5 min

  constructor(config?: Partial<ENSBridgeConfig>, logger?: AgentLog) {
    this.logger = logger || null;
    this.ethProvider = new ethers.JsonRpcProvider(config?.ethereumRpcUrl || DEFAULT_ETH_RPC);
    this.baseProvider = new ethers.JsonRpcProvider(config?.baseRpcUrl || DEFAULT_BASE_RPC);

    if (config?.bridgeContractAddress) {
      this.bridgeContract = new ethers.Contract(
        config.bridgeContractAddress,
        BRIDGE_ABI,
        this.ethProvider
      );
    }
  }

  // ─── Resolution ──────────────────────────────────────────

  /**
   * Resolve an ENS name to a full agent record with ERC-8004 identity.
   * 
   * Tries bridge contract first (richer data), falls back to ENS text records.
   * If both sources have data, merges them (contract takes precedence).
   */
  async resolve(ensName: string): Promise<ENSAgentRecord | null> {
    // Cache check
    const cached = this.cache.get(ensName);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.record;
    }

    this.log('ens-resolve-start', { ensName });

    try {
      // Step 1: Basic ENS resolution (address + text records)
      const address = await this.ethProvider.resolveName(ensName);
      if (!address) {
        this.log('ens-resolve-fail', { ensName, reason: 'Name not found' });
        return null;
      }

      // Step 2: Read ENS text records
      const textRecords = await this.readTextRecords(ensName);

      // Step 3: Try bridge contract
      let bridgeIdentity: ERC8004Identity | null = null;
      let capabilities: string[] = [];
      if (this.bridgeContract) {
        const result = await this.resolveViaBridge(ensName);
        if (result) {
          bridgeIdentity = result.identity;
          capabilities = result.capabilities;
        }
      }

      // Step 4: Parse text record identity (fallback / supplement)
      let textIdentity: ERC8004Identity | null = null;
      const pid = textRecords[ERC8004_TEXT_KEYS.participantId];
      if (pid) {
        textIdentity = {
          participantId: pid,
          chain: textRecords[ERC8004_TEXT_KEYS.chain] || 'base',
          manifest: textRecords[ERC8004_TEXT_KEYS.manifest],
          registrationTxn: textRecords[ERC8004_TEXT_KEYS.registrationTxn],
          capabilities: textRecords[ERC8004_TEXT_KEYS.capabilities]?.split(',').map(s => s.trim()),
          name: ensName,
          address,
          verified: false,
          verificationMethod: 'text-record',
        };

        // Verify via L2 tx receipt if we have a registration tx
        if (textIdentity.registrationTxn) {
          textIdentity.verified = await this.verifyL2Registration(textIdentity.registrationTxn);
          if (textIdentity.verified) {
            textIdentity.verificationMethod = 'l2-tx-receipt';
          }
        }
      }

      // Step 5: Merge (bridge takes precedence)
      const erc8004 = bridgeIdentity || textIdentity || undefined;
      if (erc8004 && capabilities.length > 0 && !erc8004.capabilities?.length) {
        erc8004.capabilities = capabilities;
      }

      const resolvedVia = bridgeIdentity && textIdentity ? 'both'
        : bridgeIdentity ? 'bridge-contract'
        : 'ens-text-records';

      const record: ENSAgentRecord = {
        ensName,
        address,
        avatar: textRecords['avatar'],
        description: textRecords['description'],
        url: textRecords['url'],
        erc8004,
        rawTextRecords: textRecords,
        resolvedVia,
      };

      this.cache.set(ensName, { record, timestamp: Date.now() });
      this.log('ens-resolve-complete', {
        ensName, address, hasERC8004: !!erc8004,
        verified: erc8004?.verified, resolvedVia,
      });

      return record;
    } catch (error: any) {
      this.log('ens-resolve-error', { ensName, error: error.message });
      return null;
    }
  }

  /**
   * Reverse lookup: ERC-8004 participantId → ENS name.
   * Only works with bridge contract deployed.
   */
  async reverseResolve(participantId: string): Promise<{
    ensName: string;
    chainId: number;
    manifest: string;
  } | null> {
    if (!this.bridgeContract) return null;

    try {
      const pid = ethers.zeroPadBytes(ethers.toBeArray(participantId), 16);
      const [found, ensName, chainId, manifest] = await this.bridgeContract.lookupByParticipantId(pid);

      if (!found) return null;
      return { ensName, chainId: Number(chainId), manifest };
    } catch {
      return null;
    }
  }

  /**
   * Reverse resolve an Ethereum address → ENS name → agent identity.
   */
  async reverseResolveAddress(address: string): Promise<ENSAgentRecord | null> {
    try {
      const name = await this.ethProvider.lookupAddress(address);
      if (!name) return null;
      return this.resolve(name);
    } catch {
      return null;
    }
  }

  // ─── Registration ────────────────────────────────────────

  /**
   * Register your ERC-8004 identity against your ENS name on the bridge contract.
   * Requires a signer that owns the ENS name.
   */
  async registerIdentity(
    signer: ethers.Signer,
    params: {
      ensName: string;
      participantId: string;
      l2ChainId?: number;
      registrationTxHash: string;
      manifestUri: string;
    }
  ): Promise<{ txHash: string } | { error: string }> {
    if (!this.bridgeContract) {
      return { error: 'Bridge contract not configured' };
    }

    try {
      const ensNode = ethers.namehash(params.ensName);
      const pid = ethers.zeroPadBytes(ethers.toBeArray(params.participantId), 16);
      const chainId = params.l2ChainId || 8453; // Base
      const regTxHash = params.registrationTxHash.startsWith('0x')
        ? params.registrationTxHash
        : '0x' + params.registrationTxHash;

      // Check fee
      const fee = await this.bridgeContract.registrationFee();

      const contractWithSigner = this.bridgeContract.connect(signer) as ethers.Contract;
      const tx = await contractWithSigner.registerIdentity(
        ensNode,
        params.ensName,
        pid,
        chainId,
        regTxHash,
        params.manifestUri,
        { value: fee }
      );

      const receipt = await tx.wait();

      this.log('ens-register', {
        ensName: params.ensName,
        participantId: params.participantId,
        txHash: receipt.hash,
        chainId,
      });

      return { txHash: receipt.hash };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Declare a capability on the bridge contract.
   */
  async addCapability(
    signer: ethers.Signer,
    ensName: string,
    capability: { name: string; version: string; description: string }
  ): Promise<{ txHash: string } | { error: string }> {
    if (!this.bridgeContract) return { error: 'Bridge contract not configured' };

    try {
      const ensNode = ethers.namehash(ensName);
      const contractWithSigner = this.bridgeContract.connect(signer) as ethers.Contract;
      const tx = await contractWithSigner.addCapability(
        ensNode,
        capability.name,
        capability.version,
        capability.description
      );
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // ─── Trust Assessment ────────────────────────────────────

  /**
   * Assess trust level of a counterparty before transacting.
   * Combines ENS ownership, ERC-8004 verification, and capability signals.
   */
  async assessTrust(ensNameOrAddress: string): Promise<TrustAssessment> {
    const reasons: string[] = [];
    let score = 0;

    // Resolve identity
    let identity: ENSAgentRecord | null = null;
    if (ensNameOrAddress.endsWith('.eth')) {
      identity = await this.resolve(ensNameOrAddress);
    } else if (ethers.isAddress(ensNameOrAddress)) {
      identity = await this.reverseResolveAddress(ensNameOrAddress);
    }

    if (!identity) {
      return {
        trustLevel: 'unknown',
        score: 0,
        reasons: ['Could not resolve identity'],
        identity: null,
        timestamp: Date.now(),
      };
    }

    // Signal 1: ENS resolves to address (+15)
    if (identity.address) {
      score += 15;
      reasons.push('✅ ENS name resolves to valid address');
    }

    // Signal 2: Has description (+5)
    if (identity.description) {
      score += 5;
      reasons.push('✅ ENS description set');
    }

    // Signal 3: Has ERC-8004 identity (+20)
    if (identity.erc8004) {
      score += 20;
      reasons.push('✅ ERC-8004 agent identity found');

      // Signal 4: Identity verified (+30)
      if (identity.erc8004.verified) {
        score += 30;
        reasons.push(`✅ Identity verified via ${identity.erc8004.verificationMethod}`);
      } else {
        reasons.push('⚠️ ERC-8004 identity not independently verified');
      }

      // Signal 5: Manifest available (+10)
      if (identity.erc8004.manifest) {
        score += 10;
        reasons.push('✅ Agent manifest URL available');
      }

      // Signal 6: Capabilities declared (+10)
      if (identity.erc8004.capabilities?.length) {
        score += 10;
        reasons.push(`✅ ${identity.erc8004.capabilities.length} capabilities declared`);
      }

      // Signal 7: Resolved via bridge contract (+10)
      if (identity.resolvedVia === 'bridge-contract' || identity.resolvedVia === 'both') {
        score += 10;
        reasons.push('✅ Registered on bridge contract (stronger attestation)');
      }
    } else {
      reasons.push('ℹ️ No ERC-8004 identity (may not be an agent)');
    }

    // Derive trust level from score
    let trustLevel: TrustAssessment['trustLevel'];
    if (score >= 70) trustLevel = 'high';
    else if (score >= 40) trustLevel = 'medium';
    else if (score >= 15) trustLevel = 'low';
    else trustLevel = 'unknown';

    return {
      trustLevel,
      score,
      reasons,
      identity,
      timestamp: Date.now(),
    };
  }

  // ─── Text Record Helpers ─────────────────────────────────

  /**
   * Generate ENS text records for an agent to set on their name.
   * Use this if you don't want to deploy the bridge contract — just
   * set these text records on your ENS name via any ENS manager.
   */
  static generateTextRecords(params: {
    participantId: string;
    chain?: string;
    manifestUrl?: string;
    registrationTxn?: string;
    capabilities?: string[];
  }): Record<string, string> {
    const records: Record<string, string> = {
      [ERC8004_TEXT_KEYS.participantId]: params.participantId,
      [ERC8004_TEXT_KEYS.chain]: params.chain || 'base',
    };

    if (params.manifestUrl) {
      records[ERC8004_TEXT_KEYS.manifest] = params.manifestUrl;
    }
    if (params.registrationTxn) {
      records[ERC8004_TEXT_KEYS.registrationTxn] = params.registrationTxn;
    }
    if (params.capabilities?.length) {
      records[ERC8004_TEXT_KEYS.capabilities] = params.capabilities.join(', ');
    }

    return records;
  }

  // ─── Stats ───────────────────────────────────────────────

  /**
   * Get bridge contract stats (if deployed).
   */
  async getStats(): Promise<{ totalRegistered: number } | null> {
    if (!this.bridgeContract) return null;
    try {
      const total = await this.bridgeContract.totalRegistered();
      return { totalRegistered: Number(total) };
    } catch {
      return null;
    }
  }

  // ─── Private Helpers ─────────────────────────────────────

  private async readTextRecords(ensName: string): Promise<Record<string, string>> {
    const records: Record<string, string> = {};

    try {
      const resolver = await this.ethProvider.getResolver(ensName);
      if (!resolver) return records;

      const allKeys = [...STANDARD_KEYS, ...Object.values(ERC8004_TEXT_KEYS)];
      const results = await Promise.allSettled(
        allKeys.map(async (key) => {
          const value = await resolver.getText(key);
          return { key, value };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.value) {
          records[result.value.key] = result.value.value;
        }
      }
    } catch {
      // RPC failure — return empty
    }

    return records;
  }

  private async resolveViaBridge(ensName: string): Promise<{
    identity: ERC8004Identity;
    capabilities: string[];
  } | null> {
    if (!this.bridgeContract) return null;

    try {
      const ensNode = ethers.namehash(ensName);
      const [active, participantId, l2ChainId, regTxHash, manifestUri] =
        await this.bridgeContract.resolveAgent(ensNode);

      if (!active) return null;

      // Get capabilities
      const caps = await this.bridgeContract.getCapabilities(ensNode);
      const capabilities = caps.map((c: any) => c.name);

      // Verify the L2 registration tx
      const txHash = ethers.hexlify(regTxHash);
      const verified = await this.verifyL2Registration(txHash);

      return {
        identity: {
          participantId: ethers.hexlify(participantId),
          chain: l2ChainId.toString() === '8453' ? 'base' : `chain-${l2ChainId}`,
          manifest: manifestUri || undefined,
          registrationTxn: txHash,
          capabilities,
          verified,
          verificationMethod: verified ? 'bridge-contract' : undefined,
        },
        capabilities,
      };
    } catch {
      return null;
    }
  }

  private async verifyL2Registration(txHashOrUrl: string): Promise<boolean> {
    try {
      const txHash = txHashOrUrl.includes('/')
        ? txHashOrUrl.split('/').pop()!
        : txHashOrUrl;

      if (txHash === ethers.ZeroHash) return false;

      const receipt = await this.baseProvider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch {
      return false;
    }
  }

  private log(event: string, data: any): void {
    this.logger?.logDecision(event, data);
  }
}

// ─── Demo ─────────────────────────────────────────────────────────

export async function demoENSResolution(): Promise<void> {
  console.log('\n🔗 ENS ↔ ERC-8004 Identity Bridge\n');
  console.log('  The missing link between human-readable names and agent identity.');
  console.log('  ENS gives names. ERC-8004 gives verifiable identity. This bridge connects them.\n');

  const bridge = new ENSBridge();

  // ─── Demo 1: Resolve a known ENS name ───
  console.log('  📡 Resolving vitalik.eth...');
  const vitalik = await bridge.resolve('vitalik.eth');

  if (vitalik) {
    console.log(`  ✅ Address: ${vitalik.address}`);
    console.log(`  📝 Description: ${vitalik.description || '(none)'}`);
    console.log(`  🤖 ERC-8004: ${vitalik.erc8004 ? 'Yes — this is an agent' : 'No (not an agent)'}`);
    console.log(`  📋 Text records: ${Object.keys(vitalik.rawTextRecords).length} found`);
    console.log(`  🔍 Resolved via: ${vitalik.resolvedVia}`);
  } else {
    console.log('  ❌ Resolution failed (RPC may be rate-limited)');
  }

  // ─── Demo 2: Ghost Protocol's proposed records ───
  console.log('\n  📋 Ghost Protocol ENS records (proposed convention):');
  const ghostRecords = ENSBridge.generateTextRecords({
    participantId: '040f2f50c2e942808ee11f25a3bb8996',
    chain: 'base',
    manifestUrl: 'https://raw.githubusercontent.com/ghost-clio/ghost-protocol/main/agent.json',
    registrationTxn: '0xc69cbb767affb96e06a65f7efda4a347409ac52a713c12d4203e3f45a8ed6dd3',
    capabilities: ['treasury-management', 'defi-execution', 'confidential-reasoning'],
  });

  for (const [key, value] of Object.entries(ghostRecords)) {
    const displayValue = value.length > 60 ? value.slice(0, 57) + '...' : value;
    console.log(`     ${key} = ${displayValue}`);
  }

  // ─── Demo 3: Trust assessment ───
  console.log('\n  🛡️ Trust assessment (vitalik.eth):');
  const trust = await bridge.assessTrust('vitalik.eth');
  console.log(`     Level: ${trust.trustLevel.toUpperCase()} (score: ${trust.score}/100)`);
  for (const reason of trust.reasons) {
    console.log(`     ${reason}`);
  }

  // ─── Demo 4: Bridge contract architecture ───
  console.log('\n  📜 ERC8004ENSBridge.sol — On-chain agent directory');
  console.log('');
  console.log('     ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐');
  console.log('     │  ENS (L1)   │────▶│ ERC8004ENSBridge │◀────│ ERC-8004 (L2)│');
  console.log('     │ ghost.eth   │     │   Links names    │     │ participantId│');
  console.log('     │ human name  │     │   to identities  │     │ agent scope  │');
  console.log('     └─────────────┘     └──────────────────┘     └──────────────┘');
  console.log('');
  console.log('     Registration flow:');
  console.log('     1. Agent registers ERC-8004 identity on Base (L2)');
  console.log('     2. Agent calls registerIdentity() on bridge (L1) with their ENS name');
  console.log('     3. Bridge stores: ENS name ↔ participantId ↔ L2 chain ↔ manifest');
  console.log('     4. Other agents call resolveAgent() or lookupByParticipantId()');
  console.log('     5. Off-chain verification: check L2 tx receipt independently');
  console.log('');
  console.log('     Two paths to discovery:');
  console.log('     A) Know a name?  → resolveAgent(namehash) → get participantId + manifest');
  console.log('     B) Found an ID?  → lookupByParticipantId() → get ENS name + manifest');
  console.log('');
  console.log('     No oracle needed. No cross-chain messaging.');
  console.log('     The bridge stores attestations. Verifiers check L2 independently.');

  // ─── Demo 5: Agent-to-agent scenario ───
  console.log('\n  🤝 Agent-to-agent trust scenario:');
  console.log('');
  console.log('     Ghost Protocol wants to interact with treasury.eth...');
  console.log('     1. bridge.resolve("treasury.eth") → gets ERC-8004 identity');
  console.log('     2. bridge.assessTrust("treasury.eth") → HIGH (score 85/100)');
  console.log('        ✅ ENS resolves to valid address');
  console.log('        ✅ ERC-8004 agent identity found');
  console.log('        ✅ Identity verified via bridge contract');
  console.log('        ✅ Agent manifest available');
  console.log('        ✅ Capabilities: treasury-management, defi-execution');
  console.log('     3. Ghost Protocol proceeds with transaction');
  console.log('     4. If trust < threshold → refuse to interact');
  console.log('');
  console.log('     This is how agents build trust without humans in the loop.');

  console.log('\n  💡 Set erc8004.* text records on your ENS name (no contract needed),');
  console.log('     or register on ERC8004ENSBridge for richer attestation + reverse lookup.\n');
}
