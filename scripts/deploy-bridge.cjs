const hre = require("hardhat");

async function main() {
  // ENS Registry on Sepolia
  const ENS_REGISTRY_SEPOLIA = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

  console.log("Deploying ERC8004ENSBridge to Sepolia...");
  console.log(`ENS Registry: ${ENS_REGISTRY_SEPOLIA}`);

  const Bridge = await hre.ethers.getContractFactory("ERC8004ENSBridge");
  const bridge = await Bridge.deploy(ENS_REGISTRY_SEPOLIA);
  const tx = bridge.deploymentTransaction();
  console.log(`TX hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  await bridge.waitForDeployment();

  const addr = await bridge.getAddress();
  console.log(`\n✅ ERC8004ENSBridge deployed: ${addr}`);
  console.log(`🔗 https://sepolia.etherscan.io/address/${addr}`);

  // Verify
  console.log("\nVerifying on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: addr,
      constructorArguments: [ENS_REGISTRY_SEPOLIA],
    });
    console.log("✅ Verified!");
  } catch (e) {
    console.log("⚠️ Verification:", e.message);
  }
}

main().catch(console.error);
