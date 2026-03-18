const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`\nDeploying Module on ${network.name} (${network.chainId})`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const safeAddr = "0x51157a48b0A00D6C9C49f0AaEe98a27511DD180a";
  console.log(`Using MockSafe: ${safeAddr}`);

  const Module = await ethers.getContractFactory("AgentScopeModule");
  const module = await Module.deploy(safeAddr);
  await module.waitForDeployment();
  const moduleAddr = await module.getAddress();
  console.log(`AgentScopeModule: ${moduleAddr}`);

  const remaining = await ethers.provider.getBalance(deployer.address);
  console.log(`\n✅ Module deployed on chain ${network.chainId} | Remaining: ${ethers.formatEther(remaining)} ETH`);

  const filename = `deployment-${network.chainId}.json`;
  fs.writeFileSync(filename, JSON.stringify({
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      mockSafe: safeAddr,
      agentScopeModule: moduleAddr,
    },
  }, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
