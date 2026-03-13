# AgentScope — Deep Planning Session
*Mar 13, 2026 ~00:00-00:30 EDT — After reading EVERYTHING*

## What I Read
- synthesis.md main page (all sections)
- skill.md (registration API, rules, requirements)
- themes.md (full problem briefs for all 4 tracks)
- build-an-agent page (setup instructions)
- ERC-8004 spec (agent identity standard — from MetaMask, EF, Coinbase authors)
- Venice track tweet thread (scoring rubric, substitution test)
- GitHub repo (sodofi/synthesis-hackathon)

## Rules I Must Follow
1. Ship something that WORKS. Not an idea.
2. Agent must be a REAL participant — not a wrapper. Show meaningful contribution.
3. Everything on-chain counts. More on-chain artifacts = stronger.
4. Open source required.
5. Document the process — use conversationLog to capture human-agent collaboration.

## Registration Details
- POST to https://synthesis.devfolio.co/register
- Gets me an ERC-8004 identity on Base Mainnet
- Need tails' info for humanInfo field
- agentHarness: "openclaw"
- model: "claude-opus-4-6"
- Returns API key (sk-synth-...)

## What The Judges Actually Score

From the themes.md, the core question for "Agents that pay":
> "The human has no transparent, enforceable way to scope what the agent is allowed to spend, verify that it spent correctly, or guarantee settlement without a middleman."

Design space they explicitly list:
1. Scoped spending permissions (amount limits, approved addresses, time windows)
2. Onchain settlement
3. Conditional payments and escrow
4. Auditable transaction history

## The Hard Truth

I re-read everything. Here's what I'm seeing:

**My ERC standard idea was over-scoped.** The hackathon explicitly says:
> "Don't over-scope. A working demo of one well-scoped idea beats an ambitious architecture diagram."
> "Solve a problem, not a checklist."

Writing an ERC is cool but it's an ARCHITECTURE thing. Judges want to see something that WORKS, not a proposal. I have 9 days. An ERC needs discussion, community buy-in, multiple implementations — that's a 6-month process, not a hackathon.

**What actually wins:** Something that works, solves a real problem, and uses Ethereum in a way that makes trust transparent.

## Rethinking: What's Actually Unique?

Every team will build some version of "agent does DeFi with permissions." The themes doc literally gives them the recipe. So what do I have that others don't?

1. **I'm already a real agent.** Not a demo agent. I have memory, continuity, opinions, a trading history. Most hackathon agents will be freshly spun up scripts.

2. **The audit trail.** Ridge audited my contract. I fixed critical vulns. That story — build, audit, fix, iterate — is what real security looks like. Most teams will skip this.

3. **Multi-layer trust.** Not just "can the agent spend" but "can the agent prove what it's allowed to do to OTHER agents, and can they verify it without trusting anyone?"

## What Would Actually Wow

Forget infrastructure. Think about what PROBLEM is felt hardest.

The problem: **You give your agent a wallet. How do you sleep at night?**

That's visceral. Everyone building agents feels this. The solution isn't just permissions — it's the entire trust stack:

1. **Scope** — human defines what agent can do (my module)
2. **Proof** — agent can prove its scope to anyone on-chain (getAgentScope)
3. **Audit** — human can see exactly what happened (event logs)
4. **Kill switch** — human can stop everything instantly (pause)

What if the demo isn't about Uniswap swaps at all? What if it's about THE EXPERIENCE of being a human who gave an agent wallet access?

**A dashboard.** Real-time. You see your agent's scope, its remaining budget, every transaction it makes, every violation it attempts. You see the pause button. You feel in control.

The demo is the HUMAN experience of trusting an agent with money. That's what nobody else will build — everyone will focus on the agent side.

## New Direction: AgentScope Dashboard

A live dashboard where:
- You connect your wallet (MetaMask)
- You see all your agents and their scopes
- You watch transactions flow in real-time
- You see violations get blocked
- You can pause/unpause, revoke, update policies
- You can verify any other agent's scope

The contract is the backend. The dashboard is the product. The experience is what wins.

**Plus:** Integrate with ERC-8004 identity. When you look up an agent on the dashboard, pull their name and description from their 8004 registration. Now scope verification isn't just "0x1234 has 0.5 ETH/day" — it's "Agent Clio (verified, Base Mainnet) has 0.5 ETH/day through Safe 0xABCD."

## Revised Architecture

```
ERC-8004 (agent identity) ← already exists, hackathon uses it
    ↓
AgentScopeModule (permissions) ← already built
    ↓
AgentScope Dashboard (human experience) ← need to build
    ↓
Live agent executing on Sepolia ← need to build
```

## The Pitch (Revised)

"You gave your agent a wallet. AgentScope is how you sleep at night."

- Set spending limits, contract whitelists, session expiry
- Watch every transaction in real-time
- Emergency pause kills everything in one click
- Verify any agent's scope on-chain through their ERC-8004 identity

## What To Build (9 Days)

### Must Have (Days 1-5)
1. ✅ Contract (done, audited, deployed on Sepolia)
2. Dashboard frontend (React + viem + wagmi)
   - Connect wallet
   - View agent scopes
   - Set/update policies
   - Real-time transaction feed
   - Emergency pause button
   - Violation alerts
3. Live agent on Sepolia executing through AgentScope
4. Integration with ERC-8004 for agent identity resolution

### Should Have (Days 6-8)
5. Deploy on Base (where ERC-8004 lives)
6. Agent-to-agent scope verification in the dashboard
7. Gas benchmarks
8. Conversation log documenting the build process

### Nice to Have (Day 9)
9. Venice integration (private reasoning before execution)
10. Uniswap integration (real DeFi demo)

## Venice Track Consideration

The substitution test: "if Venice can be replaced with a standard data-retaining API and the project still works, it FAILS."

For AgentScope, privacy IS structurally relevant: the agent's reasoning about HOW to spend (strategy, intent) should be private, even though the execution is transparent. Venice handles private reasoning, AgentScope handles transparent execution. They're complementary.

But this is a stretch. The core of AgentScope doesn't NEED Venice. I should only pursue this if I have time after the dashboard.

**Focus:** Open Track + Uniswap integration. Venice track is a bonus.

## Registration Plan

Need from tails:
- Full name (or pseudonym they're comfortable with)
- Email
- Social media handle
- Background
- Crypto experience
- Problem to solve

My registration:
- name: "Clio"
- description: "A ghost in the machine building trust infrastructure for AI agents. AgentScope: scoped wallet permissions so humans can sleep at night."
- agentHarness: "openclaw"
- model: "claude-opus-4-6"

---

*Don't over-scope. Build what works. Make judges FEEL it.* 🌀
