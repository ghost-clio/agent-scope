const hre = require("hardhat");
const fs = require("fs");
async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const bal = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(bal), "ETH");
    
    console.log("Deploying MockSafe...");
    const Safe = await hre.ethers.getContractFactory("MockSafe");
    const safe = await Safe.deploy();
    await safe.waitForDeployment();
    const safeAddr = await safe.getAddress();
    console.log("MockSafe:", safeAddr);
    
    console.log("Deploying AgentScopeModule...");
    const Module = await hre.ethers.getContractFactory("AgentScopeModule");
    const module = await Module.deploy(safeAddr);
    await module.waitForDeployment();
    const moduleAddr = await module.getAddress();
    console.log("AgentScopeModule:", moduleAddr);
    
    const remaining = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Remaining:", hre.ethers.formatEther(remaining), "ETH");
    
    fs.writeFileSync("deployment-1.json", JSON.stringify({
        network: "ethereum", chainId: 1, deployedAt: new Date().toISOString(),
        contracts: { mockSafe: safeAddr, agentScopeModule: moduleAddr }
    }, null, 2));
    console.log("DONE - saved to deployment-1.json");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
