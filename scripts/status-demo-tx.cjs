/**
 * Execute a gasless agent transaction on Status Network Sepolia
 * Proves the AI agent component + gasless tx requirement
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Load deployment
  const deployment = require("../deployment-status.json");
  console.log(`\n🤖 Agent Gasless Transaction Demo`);
  console.log(`   Chain: Status Network Sepolia (${deployment.chainId})`);
  console.log(`   Module: ${deployment.contracts.agentScopeModule}\n`);
  
  const module = await ethers.getContractAt(
    "AgentScopeModule", 
    deployment.contracts.agentScopeModule
  );

  // Read agent scope
  const scope = await module.getAgentScope(deployer.address);
  console.log(`   Agent: ${deployer.address}`);
  console.log(`   Active: ${scope[0]}`);
  console.log(`   Daily limit: ${ethers.formatEther(scope[1])} ETH`);
  console.log(`   Per-tx limit: ${ethers.formatEther(scope[2])} ETH`);

  // Emergency pause (state-changing gasless tx!) then unpause
  console.log(`\n   Executing emergency pause (gasless tx)...`);
  const safe = await ethers.getContractAt("MockSafe", deployment.contracts.mockSafe);
  
  const pauseTx = await safe.callModule(
    deployment.contracts.agentScopeModule,
    module.interface.encodeFunctionData("setPaused", [true]),
    { gasPrice: 0 }
  );
  const pauseReceipt = await pauseTx.wait();
  console.log(`   ✅ Paused — tx: ${pauseReceipt.hash}`);
  console.log(`   Gas used: ${pauseReceipt.gasUsed.toString()} (cost: 0 ETH)`);

  // Unpause
  const unpauseTx = await safe.callModule(
    deployment.contracts.agentScopeModule,
    module.interface.encodeFunctionData("setPaused", [false]),
    { gasPrice: 0 }
  );
  const unpauseReceipt = await unpauseTx.wait();
  console.log(`   ✅ Unpaused — tx: ${unpauseReceipt.hash}`);

  console.log(`\n   📋 Gasless Transaction Proofs:`);
  console.log(`   1. Policy set:  ${deployment.transactions.policySetTx}`);
  console.log(`   2. Pause:       ${pauseReceipt.hash}`);
  console.log(`   3. Unpause:     ${unpauseReceipt.hash}`);
  console.log(`\n   All transactions cost 0 ETH. Status Network is truly gasless. 🚀`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
