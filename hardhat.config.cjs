/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
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
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
