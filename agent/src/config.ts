/**
 * Ghost Protocol — Chain Configuration
 * 
 * Master toggle for chain selection. The agent works on any EVM chain —
 * just change the config. ENS resolution, ERC-8004 identity, and swap
 * execution all adapt to the selected chain.
 */

import 'dotenv/config';

// ─── Chain Definitions ────────────────────────────────────────────

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  ensSupport: 'native' | 'ccip-read' | 'none';
  ensRpcUrl?: string;  // If ENS needs a different RPC (e.g., L1 for CCIP-Read)
  uniswapSupported: boolean;
}

const CHAINS: Record<string, ChainConfig> = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    ensSupport: 'ccip-read',           // ENS via CCIP-Read from L1
    ensRpcUrl: 'https://eth.llamarpc.com', // L1 fallback for ENS
    uniswapSupported: true,
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    ensSupport: 'native',              // ENS lives here natively
    uniswapSupported: true,
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    ensSupport: 'none',
    uniswapSupported: true,
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    ensSupport: 'ccip-read',
    ensRpcUrl: 'https://eth.llamarpc.com',
    uniswapSupported: true,
  },
};

// ─── Agent Config ─────────────────────────────────────────────────

export interface AgentConfig {
  // Chain selection (master toggle)
  chain: ChainConfig;
  chainKey: string;

  // Agent identity
  participantId: string;
  registrationTxn: string;

  // API keys (optional — demo mode if missing)
  veniceApiKey?: string;
  uniswapApiKey?: string;
  walletKey?: string;

  // Execution settings
  dryRun: boolean;
  intervalMs: number;
  maxCycles: number;
  tokens: string[];

  // ENS (optional trust layer)
  ensEnabled: boolean;
  ensName?: string;

  // AgentScope contract (on-chain enforcement)
  scopeContract?: string;         // Address of deployed AgentScopeModule
}

export function loadConfig(): AgentConfig {
  const chainKey = (process.env.CHAIN || 'base').toLowerCase();
  const chain = CHAINS[chainKey];

  if (!chain) {
    const available = Object.keys(CHAINS).join(', ');
    throw new Error(`Unknown chain "${chainKey}". Available: ${available}`);
  }

  // Allow RPC override from env
  if (process.env.BASE_RPC_URL && chainKey === 'base') {
    chain.rpcUrl = process.env.BASE_RPC_URL;
  }
  if (process.env.ETH_RPC_URL && chainKey === 'ethereum') {
    chain.rpcUrl = process.env.ETH_RPC_URL;
  }

  return {
    chain,
    chainKey,

    participantId: process.env.PARTICIPANT_ID || '040f2f50c2e942808ee11f25a3bb8996',
    registrationTxn: process.env.REGISTRATION_TXN || '0xc69cbb767affb96e06a65f7efda4a347409ac52a713c12d4203e3f45a8ed6dd3',

    veniceApiKey: process.env.VENICE_API_KEY,
    uniswapApiKey: process.env.UNISWAP_API_KEY,
    walletKey: process.env.AGENT_WALLET_KEY,

    dryRun: process.env.DRY_RUN !== 'false',
    intervalMs: parseInt(process.env.INTERVAL_MS || '300000'),
    maxCycles: parseInt(process.env.MAX_CYCLES || '3'),
    tokens: (process.env.TOKENS || 'ETH,USDC,DAI').split(',').map(t => t.trim()),

    ensEnabled: process.env.ENS_ENABLED !== 'false' && chain.ensSupport !== 'none',
    ensName: process.env.ENS_NAME,

    // AgentScope: on-chain enforcement replaces hardcoded JS limits.
    // If set, the agent validates all transactions against the deployed contract.
    // If not set, AgentScope runs in local fallback mode (same logic, not on-chain).
    scopeContract: process.env.AGENT_SCOPE_CONTRACT,
  };
}

export function getChainList(): string[] {
  return Object.keys(CHAINS);
}

export function describeConfig(config: AgentConfig): string {
  const lines = [
    `⛓️  Chain: ${config.chain.name} (${config.chainKey})`,
    `🔗 RPC: ${config.chain.rpcUrl}`,
    `🔍 Explorer: ${config.chain.explorerUrl}`,
    `🆔 ENS: ${config.ensEnabled ? (config.ensName || 'enabled (no name set)') : 'disabled'}`,
    `🔒 Venice: ${config.veniceApiKey ? 'configured' : 'demo mode'}`,
    `💱 Uniswap: ${config.uniswapApiKey ? 'configured' : 'demo mode'}`,
    `🛡️  Scope: ${config.scopeContract ? `on-chain (${config.scopeContract.slice(0, 10)}...)` : 'local fallback'}`,
    `💰 Wallet: ${config.walletKey ? 'configured' : 'not set'}`,
    `🧪 Dry run: ${config.dryRun}`,
    `📊 Tokens: ${config.tokens.join(', ')}`,
  ];
  return lines.join('\n');
}
