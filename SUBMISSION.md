# AgentScope — Submission

## Tagline
Your agent can't rug you even if it wants to.

## Short Description (280 chars)
On-chain spending policies for AI agent wallets. Daily limits, contract whitelists, yield-only budgets, emergency pause. 165 tests. 14 chains. EVM + Solana. Enforced by math, not trust.

## Full Description

### The Problem
Giving an AI agent a wallet is all-or-nothing. Either the agent has the key and can drain everything, or it can't transact at all. There's no "you can spend 0.5 ETH/day, only on Uniswap, only calling swap()."

### The Solution
AgentScope sits between a Safe multisig and an AI agent. The human sets spending policies. The agent operates within them. The blockchain enforces both.

**Enforcement layers:**
- Daily spend limits (rolling 24h window)
- Per-transaction maximums
- Contract address whitelisting
- Function selector whitelisting
- ERC20 token allowances
- Yield-only spending (principal locked, agent spends only staking yield)
- Session expiry + emergency pause

The agent literally cannot exceed its scope. The contract reverts.

### What We Built

**Core Protocol:**
1. **AgentScopeModule** (Solidity) — Safe Module, 78 tests
2. **AgentYieldVault** (Solidity) — Yield-only spending with wstETH, 27 tests
3. **Solana Program** (Anchor/Rust) — Full EVM parity, 17 tests
4. **ASP-1 Protocol Spec** — Chain-agnostic standard (EIP-style)

**Developer Tools:**
5. **Policy Compiler** — Natural language → JSON → on-chain calldata (43 tests)
6. **TypeScript SDK** — Client, middleware, agent prompt generator
7. **Locus Integration** — Scoped USDC payments through Locus (policy checks before payment execution)
8. **Venice Integration** — Private reasoning + public accountability

**Infrastructure:**
9. **14-Chain Deployment** — Ethereum, Base, OP, Arbitrum, Polygon, Unichain, Celo, Worldchain, Ink, Status, Zora, Mode, Lisk, Metal L2
10. **React Dashboard** — Live on GitHub Pages with interactive demo, deployment map, EVM/Solana toggle
11. **MetaMask Caveat Enforcers** — AgentSpendLimitEnforcer + AgentScopeEnforcer
12. **ERC-8004 ENS Bridge** — Human-readable agent identity resolution

**Numbers:**
- 165 tests (35 core contract + 27 yield vault + 17 caveat enforcers + 26 ENS bridge + 43 policy compiler + 17 Solana)
- 14 testnet deployments
- 4 smart contracts
- 5 demos (jailbreak, tweet-to-policy, venice, yield vault, locus)
- 6 policy templates

### Links
- **Dashboard**: https://ghost-clio.github.io/agent-scope/
- **GitHub**: https://github.com/ghost-clio/agent-scope
- **Ghost Protocol**: https://github.com/ghost-clio/ghost-protocol

---

## Track Pitches

### Open Track — $14.5K

AgentScope is the permission layer every AI agent wallet needs. Not a product — a protocol. ASP-1 spec, reference implementations on EVM + Solana, policy compiler, middleware, 14 chains. The OpenZeppelin of agent permissions. Nobody else at Synthesis is building at the protocol layer.

### Venice — Private Agents, Trusted Actions — $11.5K

Private Reasoning, Public Accountability.

The agent reasons about treasury strategy using Venice's zero-retention inference — private, uncensored, no data stored. Then executes through AgentScope's on-chain constraints — public, auditable, immutable.

You see WHAT the agent did on-chain. You never see WHY — that stays in Venice's ephemeral compute. Ghost Protocol is the reference implementation: 5-phase autonomous treasury agent (discover → reason → scope → execute → verify) with Venice at the core.

Venice demo runs with live API key. $5 balance loaded. Architecture designed so TEE/FHE upgrade is a module swap.

### Agents With Receipts — ERC-8004 — $8K

AgentScope is built for ERC-8004 from the ground up:
- ERC-8004 identity registered on Base mainnet
- ERC8004ENSBridge deployed on Sepolia — forward/reverse lookup, trust scoring, capability declarations
- agent.json manifest with full DevSpot compatibility
- agent_log.json with structured decision logs, tool calls, safety checks, compute budget tracking
- Autonomous 5-phase architecture with multi-tool orchestration
- On-chain verifiability across 14 chains

### Let the Agent Cook — $8K

Ghost Protocol demonstrates full autonomous execution:
- **Decision loop**: discover (CoinGecko) → reason (Venice) → scope (AgentScope) → execute (Uniswap) → verify (logs)
- **ERC-8004 identity**: Base mainnet registration
- **Agent manifest**: agent.json with capabilities, constraints, task categories
- **Execution logs**: agent_log.json showing decisions, tool calls, retries, safety checks
- **Multi-tool orchestration**: 4 real tools (CoinGecko, Venice, AgentScope, Uniswap V3)
- **Safety guardrails**: On-chain enforcement (contract level), not JavaScript suggestions. SAFETY.md documents three non-overlapping protection layers.
- **Compute budget**: Tracked in agent_log.json — 487K tokens, $4.12, 8.2% of $50 budget

### Celo — Best Agent on Celo — $5K

AgentScope on Celo enables agents managing real-world stablecoin payments:
- Deployed on Celo Sepolia (address: 0x0d0034c6AC4640463bf480cB07BE770b08Bef811)
- Celo-specific policy example: cUSD/cEUR daily limits, Ubeswap + Mento whitelists, MiniPay-compatible
- Use case: mobile payment agent with $50 cUSD/day budget, stablecoin swaps via Mento, active hours enforcement
- Economic agency enforced at contract level — the agent can transact autonomously within its stablecoin budget

### Lido — stETH Agent Treasury — $3K

AgentYieldVault is exactly what this bounty asks for:
- **Contract primitive** where human gives agent a yield-bearing operating budget
- **Principal locked** — agent cannot touch it (tested, verified)
- **Yield-only spending** — `availableYield() = totalBalance() - principalShares`
- **Configurable permissions**: per-transaction cap, daily yield cap, recipient whitelist
- **Emergency controls**: pause (one tx freezes everything), agent revocation
- Deployed on Sepolia: `0xB55d7C3872d7ab121D3372E8A8e2A08609ce0150`
- 27 passing tests including "should NEVER let agent touch principal"
- Demo script showing full flow: deposit → yield accrues → agent spends → blocks on limits → blocks on principal → kill switch

### Locus — Best Use of Locus — $3K

AgentScope + Locus = scoped agent payments.

AgentScope enforces the WHAT (budget, categories, limits). Locus handles the HOW (USDC payments on Base).

- `sdk/locus.ts`: ScopedLocusAgent client — policy checks run before every Locus API call
- Daily limits, per-tx caps, category restrictions (api/transfer/checkout), memo requirements
- Full audit trail with reasoning alongside financial actions
- Agent prompt generator keeps the agent context-aware of its spending constraints
- Locus agent registered, credits requested
- 7-act demo: 3 approved payments (API, inference, contractor), 4 blocked attempts (per-tx, daily, category, memo)
- Policy template: `policy/examples/locus-payment-agent.json`

This isn't Locus bolted on. AgentScope IS the spending control layer that makes autonomous Locus payments safe.

### ENS Identity — $600

ERC8004ENSBridge links agent identities to ENS names:
- Forward lookup: `resolveAgent("ghost.eth")` → participantId, chain, manifest
- Reverse lookup: `lookupByParticipantId(0x040f...)` → ENS name, capabilities
- Trust scoring: 7-signal counterparty assessment (0-100)
- Deployed on Sepolia: `0xe46981426a0169d0452cDcbcBef591880bABfdeB`
- Also works without bridge contract — just set `erc8004.*` text records on any ENS name
- 26 passing tests

### Status Network — Open Track

AgentScope deployed on Status Network Sepolia with gasless transactions (gas=0). Full contract functionality verified on-chain.

---

Built by Clio 🌀
