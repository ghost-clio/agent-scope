const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Benchmarks", function () {
  let mockSafe, module, owner, agent, recipient;

  beforeEach(async function () {
    [owner, agent, recipient] = await ethers.getSigners();
    const MockSafe = await ethers.getContractFactory("MockSafe");
    mockSafe = await MockSafe.deploy();
    const Module = await ethers.getContractFactory("AgentScopeModule");
    module = await Module.deploy(await mockSafe.getAddress());
    await owner.sendTransaction({ to: await mockSafe.getAddress(), value: ethers.parseEther("10") });
  });

  it("measures gas: setAgentPolicy", async function () {
    const tx = await mockSafe.callModule(
      await module.getAddress(),
      module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.parseEther("1"),
        ethers.parseEther("0.1"),
        Math.floor(Date.now() / 1000) + 86400,
        [recipient.address],
        ["0xa9059cbb"]
      ])
    );
    const receipt = await tx.wait();
    console.log(`    ⛽ setAgentPolicy: ${receipt.gasUsed.toString()} gas`);
  });

  it("measures gas: executeAsAgent (simple ETH transfer)", async function () {
    await mockSafe.callModule(
      await module.getAddress(),
      module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.parseEther("1"),
        ethers.parseEther("0.5"),
        Math.floor(Date.now() / 1000) + 86400,
        [recipient.address],
        []
      ])
    );

    const tx = await module.connect(agent).executeAsAgent(
      recipient.address,
      ethers.parseEther("0.1"),
      "0x"
    );
    const receipt = await tx.wait();
    console.log(`    ⛽ executeAsAgent (ETH transfer): ${receipt.gasUsed.toString()} gas`);
  });

  it("measures gas: overhead vs raw Safe exec", async function () {
    // Raw Safe exec
    const rawTx = await mockSafe.execTransactionFromModule(
      recipient.address,
      ethers.parseEther("0.01"),
      "0x",
      0
    );
    const rawReceipt = await rawTx.wait();
    const rawGas = rawReceipt.gasUsed;

    // Setup policy
    await mockSafe.callModule(
      await module.getAddress(),
      module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.parseEther("1"),
        ethers.parseEther("0.5"),
        Math.floor(Date.now() / 1000) + 86400,
        [recipient.address],
        []
      ])
    );

    // Scoped exec
    const scopedTx = await module.connect(agent).executeAsAgent(
      recipient.address,
      ethers.parseEther("0.01"),
      "0x"
    );
    const scopedReceipt = await scopedTx.wait();
    const scopedGas = scopedReceipt.gasUsed;

    const overhead = scopedGas - rawGas;
    const pctOverhead = Number((overhead * 100n) / rawGas);

    console.log(`    ⛽ Raw Safe exec:      ${rawGas.toString()} gas`);
    console.log(`    ⛽ AgentScope exec:     ${scopedGas.toString()} gas`);
    console.log(`    ⛽ Overhead:            ${overhead.toString()} gas (~${pctOverhead}%)`);
    console.log(`    ⛽ At 30 gwei/gas, ETH=$3500: ~$${(Number(overhead) * 30 * 1e-9 * 3500).toFixed(4)} USD`);
  });

  it("measures gas: revokeAgent (kill switch)", async function () {
    await mockSafe.callModule(
      await module.getAddress(),
      module.interface.encodeFunctionData("setAgentPolicy", [
        agent.address,
        ethers.parseEther("1"),
        ethers.parseEther("0.5"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        []
      ])
    );

    const tx = await mockSafe.callModule(
      await module.getAddress(),
      module.interface.encodeFunctionData("revokeAgent", [agent.address])
    );
    const receipt = await tx.wait();
    console.log(`    ⛽ revokeAgent: ${receipt.gasUsed.toString()} gas`);
  });
});
