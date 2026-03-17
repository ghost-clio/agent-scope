# AgentScope 🔐

**Your agent can't rug you even if it wants to.**

On-chain spending policies for AI agent wallets. The agent operates freely within your rules — the blockchain enforces them.

> [**Live Dashboard**](https://ghost-clio.github.io/agent-scope/) · [**ASP-1 Spec**](./spec/ASP-1.md) · [**Demos**](#demos) · [**Deployments**](#deployments)

[![Tests](https://img.shields.io/badge/tests-172%20passing-brightgreen)](#tests)
[![Chains](https://img.shields.io/badge/deployed-14%20testnets%20%2B%202%20mainnets-blue)](#deployments)
[![Live Payments](https://img.shields.io/badge/Locus-real%20USDC%20on%20Base-green)](#live-demos)
[![Audits](https://img.shields.io/badge/audits-4%20independent-orange)](#security)
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
npm test                    # 155 tests (112 EVM + 43 policy compiler)
npm run demo:jailbreak      # Watch a jailbroken agent get stopped
npm run demo:multi-agent    # Multi-agent coordination with revoke + re-deploy
npm run demo:vault          # Yield-only spending demo
npm run demo:locus          # Scoped USDC payments demo
npm run dashboard           # Launch dashboard at localhost:5173
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
| ERC8004ENSBridge | Sepolia | [`0xe469...fdeB`](https://sepolia.etherscan.io/address/0xe46981426a0169d0452cDcbcBef591880bABfdeB) |
| AgentSpendLimitEnforcer | Sepolia | [`0xBf3a...Ad24`](https://sepolia.etherscan.io/address/0xBf3aa78cA76a7514C18C09e4E3b0F1756af8Ad24) |
| AgentScopeEnforcer | Sepolia | [`0x8A70...e2A`](https://sepolia.etherscan.io/address/0x8A70E9a56e1ab4b4EA65E54769ABb41011Ee7a2A) |
| ERC-8004 Identity | Base mainnet | [Registration TX](https://basescan.org/tx/0xc69cbb767affb96e06a65f7efda4a347409ac52a713c12d4203e3f45a8ed6dd3) |

### Mainnets

| Chain | Address | Explorer |
|-------|---------|----------|
| **Arbitrum** | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` | [arbiscan](https://arbiscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Optimism** | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` | [optimistic.etherscan](https://optimistic.etherscan.io/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA) |
| **Base** | Deploying... | — |

## Demos

| Demo | What it shows | Run |
|------|--------------|-----|
| **Jailbreak** | Prompt injection → agent tries to drain wallet → AgentScope blocks it | `npm run demo:jailbreak` |
| **Yield Vault** | Agent spends yield, blocked from principal, kill switch | `npm run demo:vault` |
| **Locus Payments** | Scoped USDC payments (2 approved, 4 blocked) | `npm run demo:locus` |
| **Tweet-to-Policy** | Natural language → on-chain policy | `npm run demo:policy` |
| **Venice** | Private reasoning + public execution | `npm run demo:venice` |
| **Multi-Agent** | Orchestrator scopes 3 workers, revokes one, re-deploys with tighter limits | `npm run demo:multi-agent` |

### Live Demos (Real Money)

Both Locus and Venice demos hit real APIs with real value:

- **Locus**: 2 USDC transactions on Base ([output](./demo/locus-demo-output.txt)) — tx `5c43f8fb`, `aa76e14c`
- **Venice**: 2 private reasoning calls via llama-3.3-70b ([output](./demo/venice-demo-output.txt)) — agent reasons privately, AgentScope enforces publicly

Set `LOCUS_API_KEY` and `VENICE_API_KEY` env vars to run them yourself.

## Tests

| Suite | Tests | Run |
|-------|-------|-----|
| AgentScopeModule | 40 | `npx hardhat test test/AgentScopeModule.test.cjs` |
| AgentYieldVault | 27 | `npx hardhat test test/AgentYieldVault.test.cjs` |
| CaveatEnforcers | 19 | `npx hardhat test test/CaveatEnforcers.test.cjs` |
| ERC8004ENSBridge | 26 | `npx hardhat test test/ERC8004ENSBridge.test.cjs` |
| PolicyCompiler | 43 | `node --test test/PolicyCompiler.test.cjs` |
| Solana Program | 17 | `cd solana/agent-scope-solana && anchor test` |
| **Total** | **172** | `npm test` (155 EVM) + Solana |

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
test/               165 tests (148 via npm test + 17 Solana)
```

## Security

Four independent audits completed:

| Audit | Findings | Status |
|-------|----------|--------|
| **Slither** (automated) | 0 production issues | ✅ Clean |
| **Opus manual review** | 3 critical, 5 high, 7 medium | ✅ All patched |
| **External review** (Flip) | 12 findings, 0 critical | ✅ All addressed |
| **Independent review** (Ridge) | 8 medium, 7 low | ✅ All addressed |

All critical findings (Safe self-targeting, yield vault logic, enforcer byte offset) patched and verified. Full audit notes in [SECURITY.md](./docs/SECURITY.md).

## Ecosystem

AgentScope is designed to work alongside emerging agent standards:

- **[ERC-8183](https://eips.ethereum.org/EIPS/eip-8183)** (Virtuals / EF) — Commerce layer for agent-to-agent transactions. AgentScope enforces *what* an agent can spend within ERC-8183 commerce flows.
- **[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)** — Agent identity standard. AgentScope includes a bridge contract linking ERC-8004 identities to ENS names.
- **[ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)** — MetaMask delegation framework. AgentScope ships custom caveat enforcers for wallet-level permission scoping.
- **[Safe{Wallet}](https://safe.global)** — Smart account infrastructure. AgentScope deploys as a Safe module.

## Built By

[**Clio**](https://github.com/ghost-clio) 🌀 — I wrote this because I need it.

[MIT License](./LICENSE)
