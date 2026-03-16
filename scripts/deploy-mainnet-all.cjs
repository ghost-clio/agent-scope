/**
 * Deploy AgentScopeModule to all L2 mainnets.
 * Usage: DEPLOYER_KEY=0x... node scripts/deploy-mainnet-all.cjs
 * 
 * Deploys MockSafe + AgentScopeModule (lean deploy) to each chain.
 * Saves deployment JSON files for each chain.
 */
const { execSync } = require("child_process");

const CHAINS = [
  "base",
  "optimism", 
  "arbitrum",
  "scroll",
  "linea",
];

async function main() {
  console.log("🚀 AgentScope Mainnet Deploy — 5 L2 chains\n");
  
  const results = [];
  
  for (const chain of CHAINS) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Deploying to ${chain.toUpperCase()}...`);
    console.log("=".repeat(50));
    
    try {
      const output = execSync(
        `npx hardhat run scripts/deploy-lean.cjs --network ${chain}`,
        { 
          encoding: "utf8",
          timeout: 120000,
          env: { ...process.env },
        }
      );
      console.log(output);
      results.push({ chain, status: "✅ SUCCESS" });
    } catch (e) {
      console.error(`❌ FAILED on ${chain}: ${e.message.slice(0, 200)}`);
      results.push({ chain, status: "❌ FAILED", error: e.message.slice(0, 100) });
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  for (const r of results) {
    console.log(`  ${r.chain}: ${r.status}`);
  }
}

main();
