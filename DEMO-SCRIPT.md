# AgentScope Demo Video Script
**Target: <2 minutes | Format: screen recording with voiceover or captions**

---

## Opening (10s)

**Screen:** Dashboard hero section — "Your agent can't rug you even if it wants to"

**Text/VO:** "You give an AI agent a wallet. How do you stop it from draining everything? AgentScope."

---

## The Problem (15s)

**Screen:** Simple animation or slide:
- Left: Human with wallet 💰
- Right: AI Agent 🤖
- Arrow: "Full access OR no access"

**Text/VO:** "Today it's all-or-nothing. Either the agent has the key and can drain everything, or it can't transact at all. There's no middle ground."

---

## The Solution (20s)

**Screen:** Dashboard architecture diagram — seatbelt/airbag visual

**Text/VO:** "AgentScope sits between a Safe wallet and your AI agent. You set the rules — daily limits, approved contracts, function whitelists, yield-only budgets. The blockchain enforces them. Not JavaScript. Not a prompt. Solidity."

**Screen:** Quick scroll through the 7 enforcement layers on dashboard

---

## The Holy Shit Moment — Jailbreak Demo (30s)

**Screen:** Terminal running `npm run demo:jailbreak`

**Text/VO:** "Watch what happens when a jailbroken agent tries to drain the wallet."

Show the 5 acts playing out:
1. Agent gets jailbroken via prompt injection
2. Agent tries to send 10 ETH → **BLOCKED** (daily limit: 0.5 ETH)
3. Agent tries unapproved contract → **BLOCKED** (not whitelisted)
4. Agent tries approved contract, small amount → ✅ **APPROVED**
5. Agent tries to exceed remaining budget → **BLOCKED**

**Text/VO:** "Five attacks. Four blocked. Zero ETH stolen. The contract doesn't care about prompt injection."

---

## Multi-Chain (10s)

**Screen:** Dashboard deployment map — 14 testnets + 2 mainnets lighting up

**Text/VO:** "Deployed on 14 testnets and 2 mainnets. Same contract, same guarantees, every chain."

---

## Policy Language (15s)

**Screen:** Dashboard policy builder or terminal running `npm run demo:policy`

**Text/VO:** "Write policies in plain English. 'Max 0.5 ETH per day, only Uniswap and Aave, no approve calls.' The compiler turns it into on-chain calldata."

Show: natural language → JSON → deployed policy

---

## Integrations (10s)

**Screen:** Quick montage of dashboard sections — Venice, Locus, Yield Vault, ENS

**Text/VO:** "Venice for private reasoning. Locus for scoped payments. Lido for yield-only budgets. ENS for agent identity. ERC-7715 for MetaMask delegation."

---

## Close (10s)

**Screen:** Dashboard with stats — tests, chains, audits

**Text/VO:** "155 tests. 4 independent audits. Open source. MIT licensed. AgentScope — because your agent should have a budget, not a blank check."

**Screen:** GitHub URL + dashboard URL

---

## Total: ~120 seconds

### Recording Notes
- Use dark terminal theme (matches dashboard)
- Dashboard sections should be pre-scrolled to right positions
- Jailbreak demo is the star — give it the most time
- No filler. Every second earns its place.
- Caption style: clean white text, bottom of screen
