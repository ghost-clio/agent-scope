/**
 * Lean deploy — just the contracts, no demo funding.
 * For low-balance chains where we can't afford to fund the Safe.
 */
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`\nDeploying on ${network.name} (${network.chainId})`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  const MockSafe = await ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy();
  await safe.waitForDeployment();
  console.log(`MockSafe: ${await safe.getAddress()}`);

  const Module = await ethers.getContractFactory("AgentScopeModule");
  const module = await Module.deploy(await safe.getAddress());
  await module.waitForDeployment();
  console.log(`AgentScopeModule: ${await module.getAddress()}`);

  const remaining = await ethers.provider.getBalance(deployer.address);
  console.log(`\n✅ Deployed on chain ${network.chainId} | Remaining: ${ethers.formatEther(remaining)} ETH`);

  // Save deployment
  const filename = `deployment-${network.chainId}.json`;
  fs.writeFileSync(filename, JSON.stringify({
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      mockSafe: await safe.getAddress(),
      agentScopeModule: await module.getAddress(),
    },
  }, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
