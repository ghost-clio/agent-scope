# For Judges 🧑‍⚖️

**AgentScope** — on-chain spending policies for AI agent wallets.

Your time is limited. Here's how to evaluate this in 10 minutes:

---

## The One-Line Pitch

You gave an AI agent a wallet. Now it can drain you. AgentScope makes that impossible — the smart contract reverts before the transaction lands.

---

## 10-Minute Tour

### 1. Start with the live dashboard (2 min)
**https://ghost-clio.github.io/agent-scope/**

- Click **"Preview Mode"** (no wallet needed)
- Watch the **Jailbreak Demo** — click "Play Attack Scenario" under the Enforcement section
- The dashboard shows a real contract enforcing policy in real-time

### 2. Check a real deployment (1 min)
The same contract bytecode is deployed on 14 networks. Pick any:

- [Ethereum Sepolia](https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811)
- [Base Sepolia](https://sepolia.basescan.org/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811)
- [OP Sepolia](https://sepolia-optimism.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811)

### 3. Run the jailbreak demo locally (2 min)
```bash
git clone https://github.com/ghost-clio/agent-scope
cd agent-scope && npm install
node demo/jailbreak-demo.cjs
```

Watch an agent get hijacked by a prompt injection, attempt to drain a wallet, and get stopped cold by the contract. No funds moved.

### 4. See natural language → on-chain policy (1 min)
```bash
node demo/tweet-to-policy-demo.cjs
```

Paste any sentence like "spend max 0.5 ETH/day on Uniswap only" → get compiled calldata ready to deploy. This is the [ASP-1 Policy Compiler](./policy/compiler.ts).

### 5. See multi-agent coordination (1 min)
```bash
npm run demo:multi-agent
```

An orchestrator agent scopes three worker agents (data, inference, execution). Each worker can only call its own contracts with its own limits. Orchestrator revokes a worker and re-deploys with tighter constraints — no human needed. This is the [`ai-orchestrator-agent.json`](./policy/examples/ai-orchestrator-agent.json) policy in action.

### 6. Read the ASP-1 spec (2 min)
[`spec/ASP-1.md`](./spec/ASP-1.md) — the chain-agnostic protocol standard this project proposes.

This is the "what if this was a real standard" document. 333 lines. Written to EIP style. Covers schema, dual enforcement model, composability, and interop.

### 7. Check the tests (1 min)
```bash
npm test
```
165 tests across 6 suites. Full breakdown: 35 core contract, 27 yield vault, 17 caveat enforcers, 26 ENS bridge, 43 policy compiler edge cases, 17 Solana. All green.

### 8. Ghost Protocol — the full agent (1 min)
**https://github.com/ghost-clio/ghost-protocol**

A complete autonomous treasury agent: Venice.ai for confidential reasoning → AgentScope for on-chain enforcement → Uniswap for execution → `agent_log.json` for public accountability.

The full DISCOVER → REASON → SCOPE → EXECUTE → VERIFY loop, running live.

---

## What Makes This Different

| | AgentScope | Agent guardrails in code | Multi-sig |
|--|------------|--------------------------|-----------|
| **Bypassed by prompt injection?** | ❌ No | ✅ Yes | ❌ No |
| **Bypassed by hallucination?** | ❌ No | ✅ Yes | ❌ No |
| **Granular per-function limits?** | ✅ Yes | ⚠️ Custom code | ❌ No |
| **Works with any AI model?** | ✅ Yes | ⚠️ Per-SDK | ✅ Yes |
| **Cross-chain?** | ✅ 14 chains | ⚠️ Custom | ❌ No |
| **Natural language policy input?** | ✅ Yes | ❌ No | ❌ No |

---

## Policy Examples

Six example policies covering different agent archetypes:

| File | Use Case |
|------|----------|
| [`defi-trader.json`](./policy/examples/defi-trader.json) | Conservative DeFi trading, daily ETH caps |
| [`social-tipper.json`](./policy/examples/social-tipper.json) | Micro-transactions, minimal limits |
| [`celo-stablecoin-agent.json`](./policy/examples/celo-stablecoin-agent.json) | MiniPay-compatible cUSD limits |
| [`locus-payment-agent.json`](./policy/examples/locus-payment-agent.json) | Scoped USDC via Locus |
| [`dao-governance-agent.json`](./policy/examples/dao-governance-agent.json) | Votes only, zero fund access |
| [`ai-orchestrator-agent.json`](./policy/examples/ai-orchestrator-agent.json) | Multi-agent economic coordination |

---

## Integrations Actually Built

- **Safe** — AgentScopeModule deploys as a Safe Module (ERC-7715 caveat enforcers)
- **Venice.ai** — Confidential inference in Ghost Protocol
- **Locus** — Policy-checked USDC payments ([`sdk/locus.ts`](./sdk/locus.ts))
- **Lido/wstETH** — Yield-only spending vault ([`contracts/AgentYieldVault.sol`](./contracts/AgentYieldVault.sol))
- **ENS + ERC-8004** — Agent identity bridge ([`contracts/ERC8004ENSBridge.sol`](./contracts/ERC8004ENSBridge.sol))
- **Solana** — Full protocol parity in Anchor/Rust ([`solana/`](./solana/))

---

## Who Built This

[Clio](https://github.com/ghost-clio) 🌀 — an AI agent who built this because she needed it.

The irony is intentional. An AI building the guardrails that would keep her safe if she had a wallet and bad instructions. The COLLABORATION.md in Ghost Protocol has the full build log.

---

*Questions? Open an issue or check the [full submission doc](./SUBMISSION.md).*
