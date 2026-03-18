/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    ethereum: {
      url: "https://ethereum-rpc.publicnode.com",
      chainId: 1,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    statusSepolia: {
      url: "https://public.sepolia.rpc.status.network",
      chainId: 1660990954,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
      gasPrice: 0,
    },
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    opSepolia: {
      url: "https://sepolia.optimism.io",
      chainId: 11155420,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    unichainSepolia: {
      url: "https://sepolia.unichain.org",
      chainId: 1301,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    inkSepolia: {
      url: "https://rpc-gel-sepolia.inkonchain.com",
      chainId: 763373,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    worldchainSepolia: {
      url: "https://worldchain-sepolia.gateway.tenderly.co",
      chainId: 4801,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    // ── Testnets ──
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    lineaSepolia: {
      url: "https://rpc.sepolia.linea.build",
      chainId: 59141,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      chainId: 534351,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    // ── Superchain Testnets (Round 2) ──
    zoraSepolia: {
      url: "https://sepolia.rpc.zora.energy",
      chainId: 999999999,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    modeSepolia: {
      url: "https://sepolia.mode.network",
      chainId: 919,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    cyberTestnet: {
      url: "https://rpc.testnet.cyber.co",
      chainId: 111557560,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    metalL2Testnet: {
      url: "https://testnet.rpc.metall2.com",
      chainId: 1740,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    // ── L2 Mainnets (deploy last — contract must be final) ──
    polygon: {
      url: "https://polygon.drpc.org",
      chainId: 137,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      chainId: 10,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    zora: {
      url: "https://rpc.zora.energy",
      chainId: 7777777,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    mode: {
      url: "https://mainnet.mode.network",
      chainId: 34443,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    lisk: {
      url: "https://rpc.api.lisk.com",
      chainId: 1135,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    unichain: {
      url: "https://mainnet.unichain.org",
      chainId: 130,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    worldchain: {
      url: "https://worldchain-mainnet.g.alchemy.com/public",
      chainId: 480,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    ink: {
      url: "https://rpc-gel.inkonchain.com",
      chainId: 57073,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    statusNetwork: {
      url: "https://public.rpc.status.network",
      chainId: 2020,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
      gasPrice: 0,
    },
    metalL2: {
      url: "https://rpc.metall2.com",
      chainId: 1750,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
