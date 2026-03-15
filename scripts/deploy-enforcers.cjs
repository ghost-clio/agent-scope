/**
 * Deploy AgentScope caveat enforcers for MetaMask Delegation Framework
 * 
 * These enforcers implement ICaveatEnforcer and can be used with any
 * delegation created through the MetaMask Smart Accounts Kit.
 *
 * Usage: npx hardhat run scripts/deploy-enforcers.cjs --network sepolia
 */
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`\n🔐 Deploying AgentScope Caveat Enforcers`);
  console.log(`   Network: ${network.name} (${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // 1. Deploy AgentSpendLimitEnforcer
  console.log("1. Deploying AgentSpendLimitEnforcer...");
  const SpendLimit = await ethers.getContractFactory("AgentSpendLimitEnforcer");
  const spendLimit = await SpendLimit.deploy();
  await spendLimit.waitForDeployment();
  const spendLimitAddr = await spendLimit.getAddress();
  console.log(`   ✅ AgentSpendLimitEnforcer: ${spendLimitAddr}`);

  // 2. Deploy AgentScopeEnforcer (composite)
  console.log("2. Deploying AgentScopeEnforcer (composite)...");
  const Scope = await ethers.getContractFactory("AgentScopeEnforcer");
  const scope = await Scope.deploy();
  await scope.waitForDeployment();
  const scopeAddr = await scope.getAddress();
  console.log(`   ✅ AgentScopeEnforcer: ${scopeAddr}`);

  // Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🎉 CAVEAT ENFORCERS DEPLOYED`);
  console.log(`  Compatible with MetaMask Delegation Framework (ERC-7710)`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Network:                ${network.name} (${network.chainId})`);
  console.log(`  AgentSpendLimitEnforcer: ${spendLimitAddr}`);
  console.log(`  AgentScopeEnforcer:      ${scopeAddr}`);
  console.log(`${"═".repeat(60)}`);

  // Save deployment
  const deployment = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    enforcers: {
      agentSpendLimitEnforcer: spendLimitAddr,
      agentScopeEnforcer: scopeAddr,
    },
    compatibility: "MetaMask Delegation Framework (ICaveatEnforcer)",
    standards: ["ERC-7710", "ERC-7715"],
  };

  fs.writeFileSync(
    "deployment-enforcers.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\n  Saved to deployment-enforcers.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
