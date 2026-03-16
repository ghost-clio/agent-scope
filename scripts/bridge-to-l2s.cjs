/**
 * Bridge small amounts of ETH from mainnet to L2s via official bridges.
 * Each chain gets 0.001 ETH (more than enough for deploys).
 */
const { ethers } = require("ethers");
require("dotenv").config();

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
const AMOUNT = ethers.parseEther("0.0015"); // 0.0015 ETH per chain

// Official L1 bridge contracts
const BRIDGES = [
  {
    name: "Base",
    // Base uses the standard OP Stack bridge (L1StandardBridge proxy)
    bridge: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
    type: "op-stack",
  },
  {
    name: "Optimism",
    bridge: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
    type: "op-stack",
  },
  {
    name: "Arbitrum",
    // Arbitrum Delayed Inbox — just send ETH to it
    bridge: "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f",
    type: "arbitrum",
  },
  {
    name: "Scroll",
    // Scroll L1 Gateway
    bridge: "0xD8A791fE2bE73eb6E6cF1eb0cb3F36adC9B3F8f9",
    type: "scroll",
  },
  {
    name: "Linea",
    // Linea L1 Message Service (just send ETH)
    bridge: "0xd19d4B5d358258f05D7B411E21A1460D11B0876F",
    type: "linea",
  },
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Mainnet balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Bridging ${ethers.formatEther(AMOUNT)} ETH to each of ${BRIDGES.length} chains\n`);
  
  const totalNeeded = AMOUNT * BigInt(BRIDGES.length);
  if (balance < totalNeeded + ethers.parseEther("0.001")) {
    console.error(`Insufficient balance. Need ~${ethers.formatEther(totalNeeded)} + gas`);
    process.exit(1);
  }

  for (const b of BRIDGES) {
    console.log(`Bridging to ${b.name}...`);
    try {
      let tx;
      
      if (b.type === "op-stack") {
        // OP Stack bridges: call depositETH(minGasLimit, extraData)
        const iface = new ethers.Interface([
          "function depositETH(uint32 _minGasLimit, bytes calldata _extraData) payable"
        ]);
        tx = await wallet.sendTransaction({
          to: b.bridge,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositETH", [200000, "0x"]),
          gasLimit: 150000,
        });
      } else if (b.type === "arbitrum") {
        // Arbitrum: call depositEth() on the inbox
        const iface = new ethers.Interface([
          "function depositEth() payable returns (uint256)"
        ]);
        tx = await wallet.sendTransaction({
          to: b.bridge,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositEth"),
          gasLimit: 150000,
        });
      } else if (b.type === "scroll") {
        // Scroll: call depositETH(amount, gasLimit) on the gateway
        const iface = new ethers.Interface([
          "function depositETH(uint256 _amount, uint256 _gasLimit) payable"
        ]);
        tx = await wallet.sendTransaction({
          to: b.bridge,
          value: AMOUNT,
          data: iface.encodeFunctionData("depositETH", [AMOUNT, 200000]),
          gasLimit: 200000,
        });
      } else if (b.type === "linea") {
        // Linea: just send ETH to the message service with the right calldata
        // Or use sendMessage(to, fee, calldata)
        const iface = new ethers.Interface([
          "function sendMessage(address _to, uint256 _fee, bytes calldata _calldata) payable"
        ]);
        tx = await wallet.sendTransaction({
          to: b.bridge,
          value: AMOUNT,
          data: iface.encodeFunctionData("sendMessage", [wallet.address, 0, "0x"]),
          gasLimit: 200000,
        });
      }
      
      console.log(`  tx: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✅ ${b.name} bridge confirmed (block ${receipt.blockNumber})`);
    } catch (e) {
      console.error(`  ❌ ${b.name} failed: ${e.message.slice(0, 150)}`);
    }
  }
  
  const remaining = await provider.getBalance(wallet.address);
  console.log(`\nRemaining mainnet balance: ${ethers.formatEther(remaining)} ETH`);
  console.log("\n⏳ Wait 5-15 minutes for bridge deposits to arrive on L2s, then run deploy-mainnet-all.cjs");
}

main().catch(console.error);
