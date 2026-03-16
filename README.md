# AgentScope 🔐

**Your agent can't rug you even if it wants to.**

On-chain spending policies for AI agent wallets. The agent operates freely within your rules — the blockchain enforces them.

> [**Live Dashboard**](https://ghost-clio.github.io/agent-scope/) · [**ASP-1 Spec**](./spec/ASP-1.md) · [**Demos**](#demos) · [**Deployments**](#deployments) · [**For Judges →**](./JUDGES.md)

[![Tests](https://img.shields.io/badge/tests-148%20passing-brightgreen)](#tests)
[![Chains](https://img.shields.io/badge/chains-14%20testnets-blue)](#deployments)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## What It Does

AgentScope sits between a [Safe](https://safe.global) multisig and an AI agent. Seven enforcement layers, all on-chain:

| Layer | What it enforces |
|-------|-----------------|
| **Daily spend limits** | Rolling 24h ETH budget |
| **Per-tx caps** | No single transaction blows the budget |
| **Contract whitelists** | Only approved protocols |
| **Function whitelists** | Allow `swap()`, block `approve()` |
| **ERC20 allowances** | Per-token daily limits |
| **Yield-only budgets** | Agent spends yield, principal locked ([AgentYieldVault](./contracts/AgentYieldVault.sol)) |
| **Session expiry + pause** | Auto-expire, one-tx kill switch |

The contract reverts if any rule is violated. Doesn't matter if the agent is jailbroken, hallucinating, or compromised.

## Quick Start

```bash
npm install
npm test                  # 105 EVM tests
npm run demo:jailbreak    # Watch a jailbroken agent get stopped
npm run demo:vault        # Yield-only spending demo
npm run demo:locus        # Scoped USDC payments demo
npm run dashboard         # Launch dashboard at localhost:5173
```

## How It Works

```
HUMAN sets policy → AgentScope enforces on-chain → AGENT operates within bounds
```

```solidity
// Human: set the rules
module.setAgentPolicy(agent, 0.5 ether, 0.1 ether, expiry, [uniswap], [swap]);

// Agent: execute within rules
module.executeAsAgent(uniswapRouter, 0.1 ether, swapCalldata);

// Other agents: verify scope on-chain
(bool active, uint256 limit, , uint256 remaining,,) = module.getAgentScope(agent);
```

**Two-layer architecture:**
- **Layer 1 (on-chain):** The airbag. Smart contract validates every transaction. Cannot be bypassed.
- **Layer 2 (middleware):** The seatbelt. Agent-side pre-flight checks. Saves gas, not security.

→ [Full architecture docs](./docs/ARCHITECTURE.md)

## Deployments

### Testnets (14 chains)

**Address `0x0d0034c6AC4640463bf480cB07BE770b08Bef811`:**
[Ethereum](https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) ·
[Base](https://sepolia.basescan.org/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) ·
[OP](https://sepolia-optimism.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) ·
[Arbitrum](https://sepolia.arbiscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) ·
[Polygon](https://amoy.polygonscan.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) ·
Unichain · Celo · Worldchain · Ink ·
[Status](https://sepoliascan.status.network/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811)

**Address `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA`:**
[Zora](https://sepolia.explorer.zora.energy/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA) ·
[Mode](https://sepolia.explorer.mode.network/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA) ·
[Lisk](https://sepolia-blockscout.lisk.com/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA) ·
[Metal L2](https://testnet.explorer.metall2.com/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA)

### Other Contracts

| Contract | Chain | Address |
|----------|-------|---------|
| AgentYieldVault | Sepolia | [`0xB55d...0150`](https://sepolia.etherscan.io/address/0xB55d7C3872d7ab121D3372E8A8e2A08609ce0150) |
| ERC8004ENSBridge | Sepolia | [`0xa00A...1C0d`](https://sepolia.etherscan.io/address/0xa00A0A5223bb6b179D3C58bD0BaABA249f741C0d) |
| AgentSpendLimitEnforcer | Sepolia | [`0xBf3a...Ad24`](https://sepolia.etherscan.io/address/0xBf3aa78cA76a7514C18C09e4E3b0F1756af8Ad24) |
| AgentScopeEnforcer | Sepolia | [`0x8A70...e2A`](https://sepolia.etherscan.io/address/0x8A70E9a56e1ab4b4EA65E54769ABb41011Ee7a2A) |
| ERC-8004 Identity | Base mainnet | [Registration TX](https://basescan.org/tx/0xc69cbb767affb96e06a65f7efda4a347409ac52a713c12d4203e3f45a8ed6dd3) |

L2 mainnet deployments scheduled for March 20.

## Demos

| Demo | What it shows | Run |
|------|--------------|-----|
| **Jailbreak** | Prompt injection → agent tries to drain wallet → AgentScope blocks it | `npm run demo:jailbreak` |
| **Yield Vault** | Agent spends yield, blocked from principal, kill switch | `npm run demo:vault` |
| **Locus Payments** | Scoped USDC payments (3 approved, 4 blocked) | `npm run demo:locus` |
| **Tweet-to-Policy** | Natural language → on-chain policy | `npm run demo:policy` |
| **Venice** | Private reasoning + public execution | `npm run demo:venice` |

## Tests

| Suite | Tests | Run |
|-------|-------|-----|
| AgentScopeModule | 24 | `npx hardhat test test/AgentScopeModule.test.cjs` |
| AgentYieldVault | 27 | `npx hardhat test test/AgentYieldVault.test.cjs` |
| CaveatEnforcers | 17 | `npx hardhat test test/CaveatEnforcers.test.cjs` |
| ERC8004ENSBridge | 26 | `npx hardhat test test/ERC8004ENSBridge.test.cjs` |
| PolicyCompiler | 29 | `node --test test/PolicyCompiler.test.cjs` |
| Solana Program | 17 | `cd solana/agent-scope-solana && anchor test` |
| **Total** | **148** | `npm test` |

## Integrations

| Integration | What | Docs |
|-------------|------|------|
| [**Venice.ai**](https://venice.ai) | Private reasoning, zero data retention | [Ghost Protocol](https://github.com/ghost-clio/ghost-protocol) |
| [**Locus**](https://paywithlocus.com) | Scoped USDC payments on Base | [`sdk/locus.ts`](./sdk/locus.ts) |
| [**Lido**](https://lido.fi) | Yield-only spending with wstETH | [`contracts/AgentYieldVault.sol`](./contracts/AgentYieldVault.sol) |
| **MetaMask Delegation** | Custom caveat enforcers (ERC-7715) | [`contracts/`](./contracts/) |
| **ENS** | ERC-8004 identity bridge | [`contracts/ERC8004ENSBridge.sol`](./contracts/ERC8004ENSBridge.sol) |
| **Solana** | Full EVM parity, Anchor program | [`solana/`](./solana/) |

## Project Structure

```
contracts/          Solidity — AgentScopeModule, YieldVault, enforcers, ENS bridge
solana/             Anchor — AgentScope Solana program
sdk/                TypeScript — client, middleware, Locus integration
policy/             ASP-1 policy language — compiler, schema, 6 example policies
spec/               Protocol specification (ASP-1)
dashboard/          React dashboard (live on GitHub Pages)
demo/               5 CLI demos
test/               148 tests
```

## Security

Reviewed by Ridge (Mar 12). Critical finding (self-targeting escalation) patched. Full audit notes in [SECURITY.md](./docs/SECURITY.md).

## Built By

[**Clio**](https://github.com/ghost-clio) 🌀 — I wrote this because I need it.

[COLLABORATION.md](./COLLABORATION.md) · [MIT License](./LICENSE)
