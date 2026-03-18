/**
 * Bridge ETH via Relay.link API and deploy contracts.
 * Usage: node scripts/bridge-and-deploy.cjs <from-chain> <to-chain> <amount-eth>
 * Example: node scripts/bridge-and-deploy.cjs optimism unichain 0.0015
 */
const { ethers } = require("ethers");
require("dotenv").config();

const CHAINS = {
  optimism:   { id: 10,      rpc: "https://mainnet.optimism.io" },
  arbitrum:   { id: 42161,   rpc: "https://arb1.arbitrum.io/rpc" },
  base:       { id: 8453,    rpc: "https://mainnet.base.org" },
  celo:       { id: 42220,   rpc: "https://forno.celo.org" },
  mode:       { id: 34443,   rpc: "https://mainnet.mode.network" },
  zora:       { id: 7777777, rpc: "https://rpc.zora.energy" },
  lisk:       { id: 1135,    rpc: "https://rpc.api.lisk.com" },
  polygon:    { id: 137,     rpc: "https://polygon.drpc.org" },
  unichain:   { id: 130,     rpc: "https://mainnet.unichain.org" },
  worldchain: { id: 480,     rpc: "https://worldchain-mainnet.g.alchemy.com/public" },
  ink:        { id: 57073,   rpc: "https://rpc-gel.inkonchain.com" },
  metalL2:    { id: 1750,    rpc: "https://rpc.metall2.com" },
};

async function getQuote(fromChainId, toChainId, amount, user) {
  const resp = await fetch("https://api.relay.link/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user,
      originChainId: fromChainId,
      destinationChainId: toChainId,
      originCurrency: "0x0000000000000000000000000000000000000000",
      destinationCurrency: "0x0000000000000000000000000000000000000000",
      amount: amount.toString(),
      tradeType: "EXACT_INPUT",
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Quote failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

async function checkStatus(requestId) {
  const resp = await fetch(`https://api.relay.link/intents/status?requestId=${requestId}`);
  return resp.json();
}

async function bridge(fromName, toName, amountEth) {
  const from = CHAINS[fromName];
  const to = CHAINS[toName];
  if (!from || !to) throw new Error(`Unknown chain: ${fromName} or ${toName}`);
  
  const key = process.env.DEPLOYER_KEY;
  if (!key) throw new Error("DEPLOYER_KEY not set");
  
  const provider = new ethers.JsonRpcProvider(from.rpc);
  const wallet = new ethers.Wallet(key, provider);
  const address = wallet.address;
  
  const balance = await provider.getBalance(address);
  console.log(`\n💰 Balance on ${fromName}: ${ethers.formatEther(balance)} ETH`);
  
  const amountWei = ethers.parseEther(amountEth);
  if (balance < amountWei) {
    throw new Error(`Insufficient balance: have ${ethers.formatEther(balance)}, need ${amountEth}`);
  }
  
  console.log(`\n🌉 Bridging ${amountEth} ETH: ${fromName} (${from.id}) → ${toName} (${to.id})`);
  
  // Get quote
  const quote = await getQuote(from.id, to.id, amountWei.toString(), address);
  const step = quote.steps[0];
  const txData = step.items[0].data;
  const requestId = step.requestId;
  
  console.log(`📋 Quote received. RequestId: ${requestId}`);
  console.log(`   To: ${txData.to}`);
  console.log(`   Value: ${ethers.formatEther(txData.value)} ETH`);
  console.log(`   Gas: ${txData.gas}`);
  
  // Send transaction
  const tx = await wallet.sendTransaction({
    to: txData.to,
    data: txData.data,
    value: txData.value,
    gasLimit: Math.ceil(Number(txData.gas) * 1.5),
  });
  
  console.log(`\n📤 TX sent: ${tx.hash}`);
  console.log(`   Waiting for confirmation...`);
  
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
  
  // Poll for bridge completion
  console.log(`\n⏳ Waiting for bridge to complete on ${toName}...`);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const status = await checkStatus(requestId);
      if (status.status === "success" || status.status === "confirmed") {
        console.log(`✅ Bridge complete!`);
        
        // Check destination balance
        const destProvider = new ethers.JsonRpcProvider(to.rpc);
        const destBal = await destProvider.getBalance(address);
        console.log(`💰 Balance on ${toName}: ${ethers.formatEther(destBal)} ETH`);
        return true;
      }
      if (status.status === "failed") {
        console.error(`❌ Bridge failed:`, JSON.stringify(status));
        return false;
      }
      process.stdout.write(".");
    } catch (e) {
      process.stdout.write("?");
    }
  }
  console.log(`\n⚠️  Timed out waiting. Check manually.`);
  return false;
}

async function main() {
  const [,, fromName, toName, amount] = process.argv;
  if (!fromName || !toName || !amount) {
    console.log("Usage: node scripts/bridge-and-deploy.cjs <from-chain> <to-chain> <amount-eth>");
    console.log("Chains:", Object.keys(CHAINS).join(", "));
    process.exit(1);
  }
  
  await bridge(fromName, toName, amount);
}

main().catch(e => { console.error(e.message); process.exit(1); });
