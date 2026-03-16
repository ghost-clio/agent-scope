/**
 * Deploy AgentYieldVault + MockERC20 (as wstETH) to testnet
 * Sets up a full demo: deposit principal, simulate yield, set agent policy
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(bal)} ETH\n`);

  // 1. Deploy mock wstETH
  console.log("1. Deploying MockERC20 (wstETH)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const wstETH = await MockERC20.deploy("Wrapped stETH", "wstETH");
  await wstETH.waitForDeployment();
  const wstAddr = await wstETH.getAddress();
  console.log(`   wstETH: ${wstAddr}`);

  // 2. Deploy AgentYieldVault
  console.log("2. Deploying AgentYieldVault...");
  const Vault = await ethers.getContractFactory("AgentYieldVault");
  const vault = await Vault.deploy(wstAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`   AgentYieldVault: ${vaultAddr}`);

  // 3. Mint wstETH to deployer (simulating staking)
  console.log("3. Minting 10 wstETH to deployer...");
  await (await wstETH.mint(deployer.address, ethers.parseEther("10"))).wait();

  // 4. Deposit principal
  console.log("4. Depositing 5 wstETH as principal...");
  await (await wstETH.approve(vaultAddr, ethers.MaxUint256)).wait();
  await (await vault.depositPrincipal(ethers.parseEther("5"))).wait();

  // 5. Simulate yield (mint extra to vault)
  console.log("5. Simulating 0.25 wstETH yield accrual...");
  await (await wstETH.mint(vaultAddr, ethers.parseEther("0.25"))).wait();

  // 6. Set agent + spending limits
  console.log("6. Setting agent + spending limits...");
  await (await vault.setAgent(deployer.address)).wait(); // deployer acts as agent for demo
  await (await vault.setSpendingLimits(
    ethers.parseEther("0.05"),  // max 0.05 wstETH per tx
    ethers.parseEther("0.1")    // max 0.1 wstETH per day
  )).wait();

  // 7. Status
  const status = await vault.getVaultStatus();
  const network = await ethers.provider.getNetwork();

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  YIELD VAULT DEPLOYED — ${network.name} (${network.chainId})`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  wstETH (mock):      ${wstAddr}`);
  console.log(`  AgentYieldVault:    ${vaultAddr}`);
  console.log(`  Principal:          ${ethers.formatEther(status._principalShares)} wstETH`);
  console.log(`  Available yield:    ${ethers.formatEther(status._availableYield)} wstETH`);
  console.log(`  Per-tx limit:       0.05 wstETH`);
  console.log(`  Daily cap:          0.1 wstETH`);
  console.log(`  Agent:              ${status._agent}`);
  console.log(`${"═".repeat(50)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
