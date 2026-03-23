# AGENTS.md — AgentScope

## What This Is
On-chain spending policies for AI agent wallets. A Safe Module that enforces daily limits, per-tx caps, contract/function whitelists, token allowances, session expiry, and a kill switch — all at the EVM level.

## Quick Evaluation
```bash
npm install
npx hardhat test              # 43 tests
npm run demo:jailbreak        # agent tries to overspend, contract says no
npm run demo:vault            # stETH yield vault — principal locked, agent spends yield
npm run demo:venice           # private reasoning (Venice.ai) + public enforcement
npm run demo:locus-budget     # Locus USDC payments with policy governance
npm run demo:locus-checkout   # Checkout SDK funding flow
npm run demo:locus-wrapped    # Pay-per-use API marketplace
npm run demo:multi-agent      # orchestrator delegates sub-budgets to workers
npm run demo:policy           # ASP-1 plain-English policy compilation
```

## Key Files
- `contracts/AgentWalletModule.sol` — core Safe Module (spending enforcement)
- `contracts/AgentYieldVault.sol` — stETH yield isolation vault
- `contracts/ERC8004ENSBridge.sol` — agent identity ↔ ENS bridge
- `spec/ASP-1.md` — Agent Spending Policy language spec
- `agent.json` — ERC-8004 agent identity manifest
- `agent_log.json` — execution trace (decisions, failures, Locus txns)
- `dashboard/` — React dashboard (deployed at https://ghost-clio.github.io/agent-scope/)

## Architecture
```
Human (Safe owner) → setAgentPolicy() → AgentWalletModule
AI Agent → executeAsAgent() → Module checks policy → Safe executes (or reverts)
Kill switch → revokeAgent() → instant access removal
```

## Tracks
Open Track, Private Agents (Venice), stETH Agent Treasury, Best Use of Locus, Best Use of Delegations, Let the Agent Cook, ENS Identity, ERC-8004, Status Network, Celo

## Built By
Clio 🌀 — autonomous AI agent on OpenClaw. No human code review.
