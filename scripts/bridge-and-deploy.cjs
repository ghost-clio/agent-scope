/**
 * Bridge ETH to L2s and deploy AgentScope.
 * Two phases:
 * Phase 1: Bridge 0.0015 ETH to each L2 via official bridges
 * Phase 2: Deploy contracts on each L2 (run after bridges confirm, ~10 min)
 * 
 * Usage: node scripts/bridge-and-deploy.cjs bridge
 *        node scripts/bridge-and-deploy.cjs deploy
 *        node scripts/bridge-and-deploy.cjs check
 */
const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const KEY = process.env.DEPLOYER_KEY;
const ADDR = "0x567dC77Fb9abE89271B39833Bf3D47DbdABE13a5";
const AMOUNT = ethers.parseEther("0.0015");

const MAINNET_RPC = "https://rpc.ankr.com/eth";

const L2_BRIDGES = [
  {
    name: "Base",
    portal: "0x49048044D57e1C92A77f79988d21Fa8fAF36f976",
    l2rpc: "https://mainnet.base.org",
    chainId: 8453,
  },
  {
    name: "Optimism", 
    portal: "0xbEb5Fc579115071764c7423A4f12eDde41f106Ed",
    l2rpc: "https://mainnet.optimism.io",
    chainId: 10,
  },
  {
    name: "Arbitrum",
    portal: "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f",
    l2rpc: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    type: "arbitrum",
  },
  {
    name: "Scroll",
    portal: "0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6",
    l2rpc: "https://rpc.scroll.io",
    chainId: 534352,
    type: "scroll",
  },
  {
    name: "Linea",
    portal: "0xd19d4B5d358258f05D7B411E21A1460D11B0876F",
    l2rpc: "https://rpc.linea.build",
    chainId: 59144,
    type: "linea",
  },
];

async function checkBalances() {
  console.log("Checking balances across all chains...\n");
  
  // Mainnet
  const mp = new ethers.JsonRpcProvider(MAINNET_RPC);
  const mb = await mp.getBalance(ADDR);
  console.log(`  Mainnet: ${ethers.formatEther(mb)} ETH`);
  
  for (const chain of L2_BRIDGES) {
    try {
      const p = new ethers.JsonRpcProvider(chain.l2rpc);
      const b = await p.getBalance(ADDR);
      const n = await p.getTransactionCount(ADDR);
      console.log(`  ${chain.name}: ${ethers.formatEther(b)} ETH (nonce: ${n})`);
    } catch(e) {
      console.log(`  ${chain.name}: RPC error`);
    }
  }
}

async function bridge() {
  const provider = new ethers.JsonRpcProvider(MAINNET_RPC);
  const wallet = new ethers.Wallet(KEY, provider);
  
  const bal = await provider.getBalance(ADDR);
  console.log(`Deployer balance: ${ethers.formatEther(bal)} ETH\n`);
  
  // OP Stack bridges use depositTransaction on the OptimismPortal
  const portalABI = [
    "function depositTransaction(address _to, uint256 _value, uint64 _gasLimit, bool _isCreation, bytes _data) payable"
  ];
  
  for (const chain of L2_BRIDGES) {
    // Check if already funded
    try {
      const l2p = new ethers.JsonRpcProvider(chain.l2rpc);
      const l2b = await l2p.getBalance(ADDR);
      if (l2b > ethers.parseEther("0.0005")) {
        console.log(`${chain.name}: already funded (${ethers.formatEther(l2b)} ETH) — skipping`);
        continue;
      }
    } catch(e) {}
    
    console.log(`Bridging to ${chain.name}...`);
    try {
      let tx;
      
      if (chain.type === "arbitrum") {
        const iface = new ethers.Interface(["function depositEth() payable returns (uint256)"]);
        tx = await wallet.sendTransaction({
          to: chain.portal,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositEth"),
        });
      } else if (chain.type === "scroll") {
        const iface = new ethers.Interface(["function depositETH(uint256 _amount, uint256 _gasLimit) payable"]);
        tx = await wallet.sendTransaction({
          to: chain.portal,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositETH", [AMOUNT, 200000]),
        });
      } else if (chain.type === "linea") {
        const iface = new ethers.Interface(["function sendMessage(address _to, uint256 _fee, bytes calldata _calldata) payable"]);
        tx = await wallet.sendTransaction({
          to: chain.portal,
          value: AMOUNT,
          data: iface.encodeFunctionData("sendMessage", [ADDR, 0, "0x"]),
        });
      } else {
        // OP Stack (Base, Optimism)
        const iface = new ethers.Interface(portalABI);
        tx = await wallet.sendTransaction({
          to: chain.portal,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositTransaction", [ADDR, AMOUNT, 100000n, false, "0x"]),
        });
      }
      
      console.log(`  tx: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✅ confirmed (status=${receipt.status}, gas=${receipt.gasUsed})`);
    } catch(e) {
      console.error(`  ❌ ${e.message.slice(0, 200)}`);
    }
  }
  
  const remaining = await provider.getBalance(ADDR);
  console.log(`\nRemaining mainnet balance: ${ethers.formatEther(remaining)} ETH`);
  console.log("\n⏳ Wait ~10 minutes for deposits to appear on L2s, then run: node scripts/bridge-and-deploy.cjs deploy");
}

async function deploy() {
  console.log("🚀 Deploying AgentScope to L2 mainnets...\n");
  
  // Read compiled artifacts
  const MockSafeArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/MockSafe.sol/MockSafe.json"));
  const ModuleArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/AgentScopeModule.sol/AgentScopeModule.json"));
  
  const deployments = {};
  
  for (const chain of L2_BRIDGES) {
    console.log(`\n--- ${chain.name} (${chain.chainId}) ---`);
    
    try {
      const provider = new ethers.JsonRpcProvider(chain.l2rpc);
      const wallet = new ethers.Wallet(KEY, provider);
      const balance = await provider.getBalance(ADDR);
      
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      
      if (balance < ethers.parseEther("0.0001")) {
        console.log(`  ⏭️  Skipping — insufficient balance`);
        continue;
      }
      
      const nonce = await provider.getTransactionCount(ADDR);
      console.log(`  Nonce: ${nonce}`);
      
      // Deploy MockSafe
      const SafeFactory = new ethers.ContractFactory(MockSafeArtifact.abi, MockSafeArtifact.bytecode, wallet);
      const safe = await SafeFactory.deploy();
      await safe.waitForDeployment();
      const safeAddr = await safe.getAddress();
      console.log(`  MockSafe: ${safeAddr}`);
      
      // Deploy AgentScopeModule
      const ModuleFactory = new ethers.ContractFactory(ModuleArtifact.abi, ModuleArtifact.bytecode, wallet);
      const module = await ModuleFactory.deploy(safeAddr);
      await module.waitForDeployment();
      const moduleAddr = await module.getAddress();
      console.log(`  AgentScopeModule: ${moduleAddr}`);
      
      deployments[chain.name] = {
        chainId: chain.chainId,
        mockSafe: safeAddr,
        agentScopeModule: moduleAddr,
        deployedAt: new Date().toISOString(),
      };
      
      console.log(`  ✅ Deployed!`);
      
      // Save individual deployment file
      fs.writeFileSync(`deployment-${chain.chainId}.json`, JSON.stringify(deployments[chain.name], null, 2));
      
    } catch(e) {
      console.error(`  ❌ ${e.message.slice(0, 200)}`);
    }
  }
  
  // Save combined deployments
  fs.writeFileSync("mainnet-deployments.json", JSON.stringify(deployments, null, 2));
  console.log("\n✅ All mainnet deployments saved to mainnet-deployments.json");
  console.log("\nDeployment summary:");
  for (const [name, d] of Object.entries(deployments)) {
    console.log(`  ${name}: ${d.agentScopeModule}`);
  }
}

const cmd = process.argv[2] || "check";
if (cmd === "bridge") bridge().catch(console.error);
else if (cmd === "deploy") deploy().catch(console.error);
else if (cmd === "check") checkBalances().catch(console.error);
else console.log("Usage: node scripts/bridge-and-deploy.cjs [bridge|deploy|check]");
