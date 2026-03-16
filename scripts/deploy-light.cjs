/**
 * Lightweight deploy — just MockSafe + AgentScopeModule, no funding/policy setup.
 * For chains with limited testnet ETH.
 */
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeploying with: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error("ERROR: No ETH. Need testnet tokens.");
    process.exit(1);
  }

  console.log("1. Deploying MockSafe...");
  const MockSafe = await ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy();
  await safe.waitForDeployment();
  const safeAddr = await safe.getAddress();
  console.log(`   MockSafe: ${safeAddr}`);

  console.log("2. Deploying AgentScopeModule...");
  const AgentScopeModule = await ethers.getContractFactory("AgentScopeModule");
  const module = await AgentScopeModule.deploy(safeAddr);
  await module.waitForDeployment();
  const moduleAddr = await module.getAddress();
  console.log(`   AgentScopeModule: ${moduleAddr}`);

  const network = await ethers.provider.getNetwork();
  console.log(`\n✅ DEPLOYED on ${network.name} (chainId: ${network.chainId})`);
  console.log(`   MockSafe:         ${safeAddr}`);
  console.log(`   AgentScopeModule: ${moduleAddr}\n`);

  // Append to deployments log
  const entry = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    mockSafe: safeAddr,
    agentScopeModule: moduleAddr,
    deployer: deployer.address,
  };

  let deployments = [];
  try { deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8")); } catch {}
  deployments.push(entry);
  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => { console.error(error); process.exit(1); });
