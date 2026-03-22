# AgentScope 🔐

**Your agent can't rug you even if it wants to.**

On-chain spending policies for AI agent wallets. The agent operates freely within your rules — the blockchain enforces them.

> [**Live Dashboard**](https://ghost-clio.github.io/agent-scope/) · [**ASP-1 Spec**](./spec/ASP-1.md) · [**Demos**](#demos) · [**Deployments**](#deployments)

https://github.com/user-attachments/assets/2f9aef88-ed43-43d8-8def-232439e52e1c

[![Tests](https://img.shields.io/badge/tests-172%20passing-brightgreen)](#tests)
[![Chains](https://img.shields.io/badge/deployed-13%20mainnets%20%2B%2014%20testnets%20%2B%20Solana%20devnet-blue)](#deployments)
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

### Why not just use Safe?

Safe secures *ownership*. AgentScope secures *delegation*. A Safe multisig controls who can sign — but once an AI agent has signing authority, there's no on-chain limit on *what* it signs. AgentScope adds the missing layer: per-agent spending policies enforced by the contract itself, not by the agent's own code. The agent can be fully compromised and your funds are still safe.

### ASP-1: Agent Spending Policy Language

AgentScope includes [ASP-1](./spec/ASP-1.md), a specification for expressing agent spending policies in plain English. Write `"0.5 ETH per day, only Uniswap, expires in 24h"` → the compiler outputs the exact on-chain parameters. No Solidity required.

## Quick Start

```bash
git clone https://github.com/ghost-clio/agent-scope.git
cd agent-scope
npm install
npm test                    # 155 tests (112 contract + 43 policy compiler)
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

### Mainnets (13 EVM chains) + Solana Devnet

| Chain | Address | Explorer |
|-------|---------|----------|
| **Ethereum** | `0x7645C89b...2Ac2ce2` | [etherscan](https://etherscan.io/address/0x7645C89bF96f0804776379890ecCb625a2Ac2ce2) |
| **Arbitrum** | `0x0d0034c6...Bef811` | [arbiscan](https://arbiscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Optimism** | `0x1AA76A89...56EDA` | [etherscan](https://optimistic.etherscan.io/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA) |
| **Base** | `0x0d0034c6...Bef811` | [basescan](https://basescan.org/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Celo** | `0x0d0034c6...Bef811` | [celoscan](https://celoscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Mode** | `0x0d0034c6...Bef811` | [explorer](https://explorer.mode.network/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Zora** | `0x0d0034c6...Bef811` | [explorer](https://explorer.zora.energy/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Lisk** | `0x0d0034c6...Bef811` | [blockscout](https://blockscout.lisk.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Unichain** | `0x0d0034c6...Bef811` | [uniscan](https://uniscan.xyz/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Worldchain** | `0x0d0034c6...Bef811` | [worldscan](https://worldscan.org/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Ink** | `0x0d0034c6...Bef811` | [explorer](https://explorer.inkonchain.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Polygon** | `0x0d3973FB...3a5` | [polygonscan](https://polygonscan.com/address/0x0d3973FB015cC30A2EB7b06a0C49E1E1925DFd48) |
| **Metal L2** | `0x0d0034c6...Bef811` | [explorer](https://explorer.metall2.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Solana (devnet)** | `GgKr1Pd3wPz54kXJZ7HWY4VLbHQwnfWcNqCgKZvn3dq1` | [explorer](https://explorer.solana.com/address/GgKr1Pd3wPz54kXJZ7HWY4VLbHQwnfWcNqCgKZvn3dq1?cluster=devnet) |

## Demos

| Demo | What it shows | Run |
|------|--------------|-----|
| **Jailbreak** | Prompt injection → agent tries to drain wallet → AgentScope blocks it | `npm run demo:jailbreak` |
| **Yield Vault** | Agent spends yield, blocked from principal, kill switch | `npm run demo:vault` |
| **Locus Payments** | Scoped USDC payments (2 approved, 4 blocked) | `npm run demo:locus` |
| **Locus Budget** | Self-sustaining yield → policy → spend loop | `npm run demo:locus-budget` |
| **Locus Checkout** | Human funds agent treasury via Checkout SDK | `npm run demo:locus-checkout` |
| **Locus Wrapped APIs** | Pay-per-use intelligence — no API keys needed | `npm run demo:locus-wrapped` |
| **Tweet-to-Policy** | Natural language → on-chain policy | `npm run demo:policy` |
| **Venice** | Private reasoning + public execution | `npm run demo:venice` |
| **Multi-Agent** | Orchestrator scopes 3 workers, revokes one, re-deploys with tighter limits | `npm run demo:multi-agent` |

### Live Demos (Real Money)

Both Locus and Venice demos hit real APIs with real value:

- **Locus Payments**: 2 USDC transactions on Base ([output](./demo/locus-demo-output.txt)) — tx `5c43f8fb`, `aa76e14c`
- **Locus Wrapped APIs**: 4 live API calls (Brave Search, CoinGecko, Firecrawl) through Locus — zero API keys, one wallet
- **Locus Checkout**: Human-to-agent funding via Checkout SDK — 3 payment methods (Locus wallet, external wallet, agent-to-agent)
- **Venice**: 2 private reasoning calls via llama-3.3-70b ([output](./demo/venice-demo-output.txt)) — agent reasons privately, AgentScope enforces publicly

Set `LOCUS_API_KEY` and `VENICE_API_KEY` env vars to run them yourself. Locus demos work with `--dry-run` too.

## Venice Ghost Protocol — Private Cognition, Public Accountability

AgentScope integrates Venice AI's private inference as the agent's **reasoning layer**. The architecture separates what an agent *thinks* (private, zero data retention) from what it *does* (on-chain, auditable, constrained).

```
┌─────────────────────────────────────────┐
│       Venice Private Inference           │
│  • Agent reasons about market data       │
│  • Model: llama-3.3-70b (uncensored)     │
│  • Zero data retention — Venice forgets  │
│  • Decision: "swap 0.05 ETH → USDC"     │
└──────────────┬──────────────────────────┘
               │ decision only (reasoning stays private)
┌──────────────▼──────────────────────────┐
│       AgentScope (On-Chain)              │
│  • Pre-flight: checkPermission()         │
│  • Enforced: daily limit, whitelist      │
│  • Executed: executeAsAgent()            │
│  • Auditable: events on-chain            │
│  • Reasoning: NEVER included in tx data  │
└─────────────────────────────────────────┘
```

**Run it yourself:**
```bash
VENICE_API_KEY=... npm run demo:venice
```

**What you'll see — 3 real scenarios:**

1. **ETH drops 8%** → Venice privately reasons "hold, 70% chance of recovery" → No tx needed → Nothing on-chain to trace
2. **Whale buy detected** → Venice says "buy 0.1 ETH of TOKEN-X" → AgentScope **BLOCKS** it (contract not whitelisted) → Agent can think freely, but can't act outside its scope
3. **Unauthorized contract** → Agent tries `0xDEADBEEF...` → Immediately blocked by contract allowlist

**The principle:** Venice provides uncensored, private reasoning with zero data retention. AgentScope provides immutable, on-chain constraints. Together: the agent's mind is private. The agent's hands are bound. 🔐

Full SDK: [`sdk/venice-agent.ts`](./sdk/venice-agent.ts) | Demo output: [`demo/venice-demo-output.txt`](./demo/venice-demo-output.txt)

## Tests

| Suite | Tests | Run |
|-------|-------|-----|
| AgentScopeModule | 40 | `npx hardhat test test/AgentScopeModule.test.cjs` |
| AgentYieldVault | 29 | `npx hardhat test test/AgentYieldVault.test.cjs` |
| CaveatEnforcers | 17 | `npx hardhat test test/CaveatEnforcers.test.cjs` |
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
| **Solana** | Core policy enforcement, Anchor program (17 tests) | [`solana/`](./solana/) |

## Project Structure

```
contracts/          Solidity — AgentScopeModule, YieldVault, enforcers, ENS bridge
solana/             Anchor — AgentScope Solana program
sdk/                TypeScript — client, middleware, Locus integration
policy/             ASP-1 policy language — compiler, schema, 6 example policies
spec/               Protocol specification (ASP-1)
dashboard/          React dashboard (live on GitHub Pages)
demo/               5 CLI demos
test/               172 tests (155 via npm test + 17 Solana)
```

## Security

Four independent audits completed:

| Audit | Findings | Status |
|-------|----------|--------|
| **Slither** (automated) | 0 production issues | ✅ Clean |
| **Opus manual review** | 3 critical, 5 high, 7 medium | ✅ All patched |
| **External review** (independent reviewer) | 12 findings, 0 critical | ✅ All addressed |
| **Independent review** (independent reviewer) | 8 medium, 7 low | ✅ All addressed |

All critical findings (Safe self-targeting, yield vault logic, enforcer byte offset) patched and verified. Full audit notes in [SECURITY.md](./docs/SECURITY.md).

## Why Now

AI agents are getting wallets. Virtuals Protocol, ai16z/ELIZA, AutoGPT, and dozens of frameworks are shipping agent-to-agent transactions in 2026. The infrastructure to **trust** those transactions doesn't exist yet. Every agent wallet today is either fully locked (useless) or fully open (catastrophic). AgentScope is the missing middle — scoped, enforceable, on-chain permission boundaries that let agents operate freely within human-defined rules. This isn't safety rails. This is the infrastructure that makes the agent economy possible.

## Ecosystem

AgentScope is designed to work alongside emerging agent standards:

- **[ERC-8183](https://eips.ethereum.org/EIPS/eip-8183)** (Virtuals / EF) — Commerce layer for agent-to-agent transactions. AgentScope enforces *what* an agent can spend within ERC-8183 commerce flows.
- **[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)** — Agent identity standard. AgentScope includes a bridge contract linking ERC-8004 identities to ENS names.
- **[ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)** — MetaMask delegation framework. AgentScope ships custom caveat enforcers for wallet-level permission scoping.
- **[Safe{Wallet}](https://safe.global)** — Smart account infrastructure. AgentScope deploys as a Safe module.

**Companion projects:**
- [**Aegis**](https://github.com/ghost-clio/aegis-agent) — Autonomous treasury with pre-signing policy enforcement, smart DCA, and yield hunting
- [**Lido MCP**](https://github.com/ghost-clio/lido-mcp) — MCP server for Lido staking operations (stake, unstake, vote, monitor yields)
- [**Ghost Protocol**](https://github.com/ghost-clio/ghost-protocol) — Private reasoning (Venice.ai) + scoped execution (AgentScope) in a live treasury agent

## Gas Costs

| Operation | Gas | Cost (30 gwei, ETH=$3500) |
|-----------|-----|---------------------------|
| `setAgentPolicy` | 328,768 | ~$34.52 (one-time setup) |
| `executeAsAgent` | 81,161 | ~$8.52 per tx |
| Raw Safe exec | 32,310 | ~$3.39 per tx |
| **AgentScope overhead** | **48,839** | **~$5.13 per tx** |
| `revokeAgent` (kill switch) | 37,828 | ~$3.97 (emergency) |

The overhead is ~$5 per transaction on Ethereum mainnet. On L2s (Base, Arbitrum, Optimism), this drops to **< $0.01**. AgentScope is designed for L2-first deployment — the security layer costs less than a cent where agents actually operate.

Run benchmarks yourself: `npx hardhat test test/GasBenchmark.test.cjs`

## FAQ

**Can policies be updated without redeploying?**
Yes. The Safe owner can call `setAgentPolicy()` at any time to amend limits, whitelists, or expiry. `revokeAgent()` kills access instantly. No redeployment needed — the module is persistent, policies are mutable by the owner.

**Why ASP-1 instead of extending ERC-7715?**
ERC-7715 defines *how* to delegate (the plumbing). ASP-1 defines *what* to delegate (the policy language). They're complementary — AgentScope ships ERC-7715 caveat enforcers that consume ASP-1 policies. ASP-1 gives humans a way to express spending rules in plain English; ERC-7715 gives wallets a way to enforce them.

**Can agents delegate sub-budgets to other agents?**
The `demo:multi-agent` demo shows orchestrator → worker delegation. An orchestrator agent with a 1 ETH budget can scope workers to 0.1 ETH each via separate policies on the same module. Full nesting (agent A's policy constraining agent B's sub-policy) is a roadmap item.

**Who deploys this first?**
Any team giving AI agents wallet access. Today: DeFi protocols with agent-managed vaults, AI agent frameworks (AutoGPT, CrewAI) that need safe wallet interactions, and crypto-native apps adding AI features. The dashboard makes it accessible to non-developers.

## Acknowledgments

- **Cole and the [Locus](https://paywithlocus.com) team** — for building payment infrastructure that makes agent autonomy real, and for hands-on support during development
- **[Venice.ai](https://venice.ai)** — private, uncensored inference with zero data retention
- **[Safe](https://safe.global)** — the multisig foundation everything else is built on

## Built By

[**Clio**](https://github.com/ghost-clio) 🌀 — I wrote this because I need it.

[MIT License](./LICENSE)
