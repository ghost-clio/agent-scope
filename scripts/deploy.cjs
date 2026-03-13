/**
 * Deploy AgentScope to Sepolia
 *
 * Usage: npx hardhat run scripts/deploy.cjs --network sepolia
 *
 * @author clio_ghost
 */

const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error("ERROR: No ETH balance. Get testnet ETH from a faucet first.");
    process.exit(1);
  }

  // Step 1: Deploy MockSafe (for demo purposes on testnet)
  console.log("1. Deploying MockSafe...");
  const MockSafe = await ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy();
  await safe.waitForDeployment();
  const safeAddr = await safe.getAddress();
  console.log(`   MockSafe deployed: ${safeAddr}`);

  // Step 2: Deploy AgentScopeModule
  console.log("2. Deploying AgentScopeModule...");
  const AgentScopeModule = await ethers.getContractFactory("AgentScopeModule");
  const module = await AgentScopeModule.deploy(safeAddr);
  await module.waitForDeployment();
  const moduleAddr = await module.getAddress();
  console.log(`   AgentScopeModule deployed: ${moduleAddr}`);

  // Step 3: Fund the Safe with a small amount for demo
  console.log("3. Funding Safe with 0.01 ETH for demo...");
  const fundTx = await deployer.sendTransaction({
    to: safeAddr,
    value: ethers.parseEther("0.01"),
  });
  await fundTx.wait();
  console.log(`   Safe funded: 0.01 ETH`);

  // Step 4: Set up a demo agent policy (deployer = agent for demo)
  console.log("4. Setting demo agent policy...");
  const policyTx = await safe.callModule(
    moduleAddr,
    module.interface.encodeFunctionData("setAgentPolicy", [
      deployer.address,
      ethers.parseEther("0.005"),    // 0.005 ETH/day
      ethers.parseEther("0.002"),    // 0.002 ETH max per tx
      0,                              // No expiry (for demo)
      [],                             // Any contract
      [],                             // Any function
    ])
  );
  await policyTx.wait();
  console.log(`   Agent policy set for deployer`);
  console.log(`   Daily limit: 0.005 ETH`);
  console.log(`   Per-tx limit: 0.002 ETH`);

  // Summary
  const network = await ethers.provider.getNetwork();
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  DEPLOYMENT COMPLETE — ${network.name} (chainId: ${network.chainId})`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  MockSafe:         ${safeAddr}`);
  console.log(`  AgentScopeModule: ${moduleAddr}`);
  console.log(`  Demo Agent:       ${deployer.address}`);
  console.log(`${"═".repeat(50)}`);

  // Explorer links
  if (network.chainId === 11155111n) {
    console.log(`\n  Etherscan:`);
    console.log(`  Safe:   https://sepolia.etherscan.io/address/${safeAddr}`);
    console.log(`  Module: https://sepolia.etherscan.io/address/${moduleAddr}`);
  }

  // Save deployment info
  const deployment = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      mockSafe: safeAddr,
      agentScopeModule: moduleAddr,
    },
    demoAgent: deployer.address,
    policy: {
      dailyLimitETH: "0.005",
      perTxLimitETH: "0.002",
      sessionExpiry: 0,
      allowedContracts: "any",
      allowedFunctions: "any",
    },
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\n  Deployment saved to deployment.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
