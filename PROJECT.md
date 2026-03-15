# PROJECT.md — AgentScope (Synthesis Hackathon)

## What I'm Building
A Safe Module that gives AI agents scoped, policy-bound wallet access. Owners set spending limits, whitelist contracts/functions, set session expiry — agents execute within those bounds. No multi-sig per tx, no full custody handoff.

## What "Done" Looks Like
- [ ] Contract deployed on Base (not just Sepolia — judges care about real chains)
- [ ] Dashboard that WORKS end-to-end: connect wallet → set policy → simulate agent tx → see events
- [ ] SDK that a dev could npm install and use in 5 minutes
- [ ] Demo video showing the full flow (< 2 min)
- [ ] README that makes a judge say "I get it" in 30 seconds
- [ ] Submission posted to Synthesis

## What Makes This Undeniable
The "holy shit" moment: a live demo where an AI agent autonomously executes a swap, hits its daily limit, gets blocked on the next attempt — all visible in real-time on the dashboard. Judges SEE the guardrails working.

## Phase Plan

### Phase 1: Dashboard Polish (NOW)
- Demo mode that walks through the full flow without a wallet
- Event feed showing real Sepolia events
- Mobile responsive
- Loading states, error handling, edge cases

### Phase 2: Base Deployment
- Deploy contract to Base mainnet or Base Sepolia
- Update dashboard to support Base
- Verify on Basescan

### Phase 3: SDK Package
- Clean up sdk/index.ts
- Add usage examples
- npm-ready (even if not published)

### Phase 4: Demo & Submission
- Record demo video (Loom or screen capture)
- Final README pass
- Submit to Synthesis

## Target Tracks
1. "Agents that pay" — exact match
2. "Agents With Receipts — ERC-8004" ($8K) — we have ENS bridge
3. Open Track ($14.5K)

## Deadline
Mar 22, 2026. Judging feedback starts Mar 18.

## Status
Last updated: 2026-03-15 14:30 ET
- Contract: ✅ Deployed on 8 chains (same address), 67 tests passing, reentrancy guard + O(1) whitelists
- Dashboard: ✅ Live on GitHub Pages with guided interactive demo (6-step walkthrough), visual overhaul
- SDK: ✅ npm-ready structure (package.json, tsconfig, README)
- Demo script: ✅ `npx hardhat run demo/scenario.cjs` — full 7-act E2E demo, all constraints verified
- MetaMask: ✅ 2 custom caveat enforcers deployed (AgentSpendLimitEnforcer + AgentScopeEnforcer)
- Venice: ✅ SDK + demo built, need API credits for live calls
- ENS: ✅ ERC8004ENSBridge deployed on Sepolia, README section complete
- CI/CD: ✅ gh-pages deployment working
- Submission draft: ✅ SUBMISSION.md with all 6 track pitches
- **ASP-1 Spec: ✅ Protocol specification draft (spec/ASP-1.md) — chain-agnostic standard**
- **Policy Language: ✅ Compiler + validator + NL parser + templates (policy/compiler.ts)**
- **Agent Middleware: ✅ Self-enforcing agent wrapper with spending tracker (sdk/middleware.ts)**
- **Policy Schema: ✅ JSON Schema for policy documents (policy/schema.json)**
- **Example Policies: ✅ DeFi trader + social tipper templates (policy/examples/)**
- Demo video: ⬜ Need to record (screen capture of guided demo + scenario.cjs output)
- Submission: ⬜ Waiting for portal to open (deadline Mar 22)
- Solana program: ⬜ Planned after ETH version is finalized
