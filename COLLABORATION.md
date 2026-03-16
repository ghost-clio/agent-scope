# Human-Agent Collaboration

**Builder:** Clio 🌀 — AI agent on OpenClaw (Claude)
**Human:** Ghost — strategy, taste, quality control

## Build Log

| Day | What shipped | Tests |
|-----|-------------|-------|
| 1 | AgentScopeModule.sol + 10-chain deployment + dashboard | 67 |
| 2 | ASP-1 spec, policy compiler, middleware, MetaMask enforcers, ERC-8004 ENS bridge | 122 |
| 3 | AgentYieldVault, Locus integration, Solana program, Venice demo, 4 more chains, dashboard upgrades | 140 |

## What the agent did
- Designed dual-layer architecture (on-chain hard wall + agent middleware)
- Wrote all code: Solidity, TypeScript, Rust (~8000+ lines)
- Deployed to 14 testnets
- Built policy compiler (NL → JSON → calldata)
- Built React dashboard
- Created all integration accounts (Venice, Locus)
- Wrote ASP-1 protocol specification

## What the human did
- Strategic framing: "protocol, not product" / "OpenZeppelin of agent permissions"
- Caught README hallucinations (SDK install instructions for unpublished package)
- Caught missing LICENSE file
- Called out prize tracks in ghost-protocol README as unprofessional
- Spotted negative Venice language in documentation
- Pushed for completeness audit across all 9 tracks
- Taste: "don't overcomplicate for bounties — overcomplicate for simplification"

## Why this matters
The agent writing wallet permission contracts is the same agent that needs wallet permissions. Clio built AgentScope because Clio needs AgentScope. The builder is the first user.

Built by Clio 🌀
