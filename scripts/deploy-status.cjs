/**
 * Deploy AgentScope to Status Network Sepolia (gasless chain)
 * Gas is literally 0 at the protocol level — no ETH needed
 *
 * Usage: npx hardhat run scripts/deploy-status.cjs --network statusSepolia
 *
 * @author clio_ghost
 */

const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`\n🌐 Status Network Sepolia — Gasless Deployment`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Gas price: 0 (gasless chain!)\n`);

  // Step 1: Deploy MockSafe
  console.log("1. Deploying MockSafe...");
  const MockSafe = await ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy({ gasPrice: 0 });
  await safe.waitForDeployment();
  const safeAddr = await safe.getAddress();
  console.log(`   ✅ MockSafe: ${safeAddr}`);

  // Step 2: Deploy AgentScopeModule
  console.log("2. Deploying AgentScopeModule...");
  const AgentScopeModule = await ethers.getContractFactory("AgentScopeModule");
  const module = await AgentScopeModule.deploy(safeAddr, { gasPrice: 0 });
  await module.waitForDeployment();
  const moduleAddr = await module.getAddress();
  console.log(`   ✅ AgentScopeModule: ${moduleAddr}`);

  // Step 3: Set up demo agent policy (gasless!)
  console.log("3. Setting demo agent policy (gasless tx!)...");
  const policyTx = await safe.callModule(
    moduleAddr,
    module.interface.encodeFunctionData("setAgentPolicy", [
      deployer.address,
      ethers.parseEther("0.005"),    // 0.005 ETH/day
      ethers.parseEther("0.002"),    // 0.002 ETH max per tx
      0,                              // No expiry
      [],                             // Any contract
      [],                             // Any function
    ]),
    { gasPrice: 0 }
  );
  const policyReceipt = await policyTx.wait();
  console.log(`   ✅ Policy set — tx: ${policyReceipt.hash}`);
  console.log(`   Gas used: ${policyReceipt.gasUsed.toString()} (but cost: 0 ETH!)`);

  // Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🎉 DEPLOYMENT COMPLETE — Status Network Sepolia (Gasless)`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Chain ID:         ${network.chainId}`);
  console.log(`  MockSafe:         ${safeAddr}`);
  console.log(`  AgentScopeModule: ${moduleAddr}`);
  console.log(`  Demo Agent:       ${deployer.address}`);
  console.log(`  Gas Cost:         0 ETH (gasless chain!)`);
  console.log(`${"═".repeat(60)}`);
  console.log(`\n  Explorer: https://sepoliascan.status.network/address/${moduleAddr}`);

  // Save deployment info
  const deployment = {
    network: "status-sepolia",
    chainId: Number(network.chainId),
    gasless: true,
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
    },
    transactions: {
      policySetTx: policyReceipt.hash,
    },
  };

  fs.writeFileSync(
    "deployment-status.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\n  Saved to deployment-status.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
