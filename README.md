# AgentScope 🔐

**Your agent can't rug you even if it wants to.**

On-chain spending policies for AI agent wallets. One protocol. Every chain. The agent operates freely within your rules — the chain enforces them, not trust.

> 🌐 **Deployed on 10 chains** — same address everywhere: [`0x0d0034c6AC4640463bf480cB07BE770b08Bef811`](https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811)
>
> 🖥️ **Dashboard:** [ghost-clio.github.io/agent-scope](https://ghost-clio.github.io/agent-scope/)
>
> 📄 **Spec:** [ASP-1 Protocol](./spec/ASP-1.md) — chain-agnostic standard for agent constraints
>
> 🧪 **96 tests passing** | 🏗️ Safe Module | 🔗 MetaMask Delegation | 🆔 ERC-8004 ENS Bridge

## The Problem

Right now, giving an AI agent a wallet is all-or-nothing. Either the agent has the private key and can do **anything** — drain the wallet, approve unlimited token spending, interact with malicious contracts — or it can't transact at all.

You're left trusting a statistical model with your money. Hope it behaves. Hope it doesn't hallucinate an approval. Hope nobody injects a prompt that says "send everything to this address."

That's not how trust should work.

## The Solution

AgentScope sits between your Safe and your agent. The human sets the rules. The agent operates within them. The chain enforces both.

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│    HUMAN     │────▸│   AgentScopeModule   │────▸│     SAFE     │
│  (Safe Owner)│     │                       │     │   (Funds)    │
│              │     │  ┌─────────────────┐ │     │              │
│ Sets policy: │     │  │  Policy Engine   │ │     │  Executes    │
│ • 0.5 ETH/day│     │  │  ✓ Spend limit   │ │     │  only if     │
│ • Uniswap    │     │  │  ✓ Contract list │ │     │  module      │
│   only       │     │  │  ✓ Function list │ │     │  approves    │
│ • swap() only│     │  │  ✓ Session expiry│ │     │              │
│ • Expires 24h│     │  └─────────────────┘ │     │              │
└──────────────┘     └─────────────────────┘     └──────────────┘
                              │
                     ┌────────┴────────┐
                     │   AGENT (EOA)    │
                     │                  │
                     │ Calls            │
                     │ executeAsAgent() │
                     │                  │
                     │ Can also call    │
                     │ getAgentScope()  │
                     │ to prove its     │
                     │ permissions to   │
                     │ OTHER agents     │
                     └─────────────────┘
```

## Features

### For Humans
- **Daily spend limits** — cap how much ETH your agent can move per fixed 24h window
- **Per-transaction limits** — prevent an agent from blowing the daily budget in one tx
- **Contract whitelists** — restrict which protocols your agent can interact with
- **Function-level permissions** — allow `swap()` but block `approve()` 
- **ERC20 token limits** — separate daily limits for each token (enforced on `transfer`, `approve`, `transferFrom`)
- **Session expiry** — permissions auto-expire, agent must re-request access
- **Emergency pause** — `setPaused(true)` kills ALL agent execution instantly, one tx
- **One-tx revocation** — kill individual agent permissions instantly

### For Agents
- **`executeAsAgent()`** — transact through the Safe within your policy
- **`getAgentScope()`** — proof of permissions for this Safe, verifiable on-chain
- **`checkPermission()`** — pre-flight check before attempting execution
- Other agents can verify your budget and scope without trusting you or your human

### For Agent-to-Agent Trust
When Agent A talks to Agent B, B can call `getAgentScope(A)` on-chain and verify:
- A has spending authority through a specific Safe
- A's permissions haven't expired
- A has remaining budget

This is **proof of constraint on a specific Safe** — not a universal identity. An agent could have other wallets. But for the question "can this agent spend up to X through this Safe?", the answer is on-chain.

No centralized registry. No API keys. Just math.

## Live Deployments

AgentScope is deployed and verified across multiple networks:

| Network | Chain ID | AgentScopeModule | Explorer |
|---------|----------|------------------|----------|
| **Ethereum Sepolia** | 11155111 | `0x0d00...Bef811` | [etherscan](https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **OP Sepolia** | 11155420 | `0x0d00...Bef811` | [blockscout](https://optimism-sepolia.blockscout.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Base Sepolia** | 84532 | `0x0d00...Bef811` | [blockscout](https://base-sepolia.blockscout.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Unichain Sepolia** | 1301 | `0x0d00...Bef811` | [blockscout](https://unichain-sepolia.blockscout.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Celo Sepolia** | 11142220 | `0x0d00...Bef811` | [blockscout](https://celo-sepolia.blockscout.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Worldchain Sepolia** | 4801 | `0x0d00...Bef811` | [blockscout](https://worldchain-sepolia.blockscout.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Ink Sepolia** | 763373 | `0x0d00...Bef811` | — |
| **Arbitrum Sepolia** | 421614 | `0x0d00...Bef811` | [arbiscan](https://sepolia.arbiscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Polygon Amoy** | 80002 | `0x0d00...Bef811` | [polygonscan](https://amoy.polygonscan.com/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |
| **Status Network Sepolia** | 1660990954 | `0x0d00...Bef811` | [explorer](https://sepoliascan.status.network/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811) |

> **Same address on every chain:** `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` — deterministic deployment via same deployer + nonce. L2 mainnet deployments scheduled for March 20.

**MetaMask Delegation Framework Enforcers** (Ethereum Sepolia):

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentSpendLimitEnforcer | `0xBf3aa78cA76a7514C18C09e4E3b0F1756af8Ad24` | Rolling 24h spend tracking per delegation |
| AgentScopeEnforcer | `0x8A70E9a56e1ab4b4EA65E54769ABb41011Ee7a2A` | Composite: spend + whitelist + pause |

**ERC-8004 ENS Bridge** (Ethereum Sepolia):

| Contract | Address | Purpose |
|----------|---------|---------|
| ERC8004ENSBridge | `0xa00A0A5223bb6b179D3C58bD0BaABA249f741C0d` | Links ENS names ↔ ERC-8004 agent identities |

> **Status Network:** All transactions are gasless (gas=0) — ideal for high-frequency agent operations.
>
> **Unichain:** Native Uniswap L2 — agents constrained to `swap()` only, operating on Uniswap's home chain.
>
> **Celo:** Native stablecoin infrastructure — agents managing real-world payments with predictable costs.

## MetaMask Delegation Framework Integration

AgentScope extends the [MetaMask Delegation Framework](https://github.com/MetaMask/delegation-framework) with custom **caveat enforcers** designed for AI agent delegations.

### Why Delegations?

The Delegation Framework (ERC-7710/ERC-7715) provides a standard way for smart accounts to delegate authority with restrictions. AgentScope's policies map naturally to delegation caveats:

| AgentScope Policy | Delegation Caveat |
|-------------------|-------------------|
| Daily spend limit | `AgentSpendLimitEnforcer` — rolling 24h window |
| Per-tx maximum | Built into `AgentSpendLimitEnforcer` |
| Contract whitelist | `AgentScopeEnforcer` — target address validation |
| Function whitelist | `AgentScopeEnforcer` — selector validation |
| Emergency pause | `AgentScopeEnforcer` — delegator-controlled pause |

### Novel Contributions

- **Rolling 24h spend windows** — Unlike the built-in `NativeTokenTransferAmountEnforcer` which tracks cumulative spend, `AgentSpendLimitEnforcer` resets daily for sustainable ongoing agent operations
- **Composite enforcer** — `AgentScopeEnforcer` bundles daily limits + per-tx caps + contract/function whitelists + pause into a single enforcer, reducing delegation complexity and gas costs
- **Delegation-scoped tracking** — Each delegation hash has independent spend tracking, so a single agent can have multiple delegations with different budgets

### Usage with MetaMask Smart Accounts Kit

```typescript
import { createCaveatBuilder } from "@metamask/delegation-framework";

// Create a delegation with AgentScope caveats
const caveats = createCaveatBuilder(chain.id)
  .addCaveat(
    "AgentScopeEnforcer",
    AGENT_SCOPE_ENFORCER_ADDRESS,
    encodeAbiParameters(
      [
        { type: "uint256" }, // dailyLimitWei
        { type: "uint256" }, // maxPerTxWei
        { type: "address[]" }, // allowedContracts
        { type: "bytes4[]" },  // allowedSelectors
      ],
      [
        parseEther("0.5"),           // 0.5 ETH/day
        parseEther("0.1"),           // 0.1 ETH max per tx
        [UNISWAP_ROUTER],           // Only Uniswap
        ["0x38ed1739"],              // Only swap()
      ]
    )
  );

const delegation = createDelegation(delegatorAccount, agentAddress, caveats);
```

## Venice AI Integration — Private Reasoning

AgentScope pairs with [Venice AI](https://venice.ai) to create agents with **private reasoning and public accountability**.

```
┌─────────────────────────────────┐
│     Venice Private Inference     │
│  • Agent analyzes market data    │
│  • Decides: "swap 0.05 ETH"     │  ← PRIVATE (no logs, no retention)
│  • Zero data retention           │
└──────────────┬──────────────────┘
               │ decision
┌──────────────▼──────────────────┐
│     AgentScope (On-Chain)        │
│  • Pre-flight: checkPermission() │
│  • Enforced: daily limit, etc.   │  ← PUBLIC (auditable on-chain)
│  • Executed: executeAsAgent()    │
└─────────────────────────────────┘
```

The agent's **reasoning** stays private — Venice guarantees zero data retention. The agent's **actions** are fully auditable on-chain. You see *what* happened, never *why*.

```typescript
import { VeniceAgent } from "./sdk/venice-agent";

const agent = new VeniceAgent({
  veniceApiKey: process.env.VENICE_API_KEY,
  agentScope: scopeClient,
  model: "llama-3.3-70b",
  agentAddress: "0x...",
});

// Full cycle: private reasoning → public execution
const result = await agent.act({
  context: "ETH dropped 5%. Portfolio: 80% ETH, 20% USDC.",
  availableActions: ["swap 0.05 ETH → USDC", "hold", "buy more ETH"],
});
// result.executed: true
// result.txHash: "0xabc..." (on-chain, auditable)
// Private reasoning: GONE (Venice ephemeral compute)
```

```bash
# Run the demo (mock mode works without API key)
node demo/venice-demo.cjs
```

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test          # 96 tests — all passing
```

### Run the Dashboard

```bash
cd dashboard
npm install
npm run dev               # opens at http://localhost:5173
```

Connect MetaMask to Sepolia to view agent scopes, set policies, and monitor transactions in real-time.

## Usage

### 1. Deploy the module
```solidity
AgentScopeModule module = new AgentScopeModule(address(safe));
// Enable the module on your Safe
```

### 2. Set an agent policy (called through Safe)
```solidity
module.setAgentPolicy(
    agentAddress,           // Agent EOA
    0.5 ether,             // 0.5 ETH daily limit
    0.1 ether,             // 0.1 ETH max per transaction
    block.timestamp + 24 hours, // Expires in 24h
    allowedContracts,       // [uniswapRouter]
    allowedFunctions        // [swap.selector]
);
```

### 3. Agent executes within scope
```solidity
// Agent calls directly — module checks all constraints
module.executeAsAgent(
    uniswapRouter,
    0.1 ether,
    swapCalldata
);
```

### 4. Another agent verifies scope
```solidity
(bool active, uint256 limit, uint256 expiry, uint256 remaining, , ) = 
    module.getAgentScope(agentAddress);
// Now you know exactly what this agent can do
```

## ERC-8004 Identity Bridge (ENS)

AgentScope includes an **ERC8004ENSBridge** contract that links [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agent identities to ENS names, enabling human-readable identity resolution for scoped agents.

**Deployed:** [`0xa00A0A5223bb6b179D3C58bD0BaABA249f741C0d`](https://sepolia.etherscan.io/address/0xa00A0A5223bb6b179D3C58bD0BaABA249f741C0d) on Sepolia (ENS Registry: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`)

### The Problem

ERC-8004 gives agents verifiable on-chain identity, but those identities are hex participant IDs — not human-readable, not discoverable. ENS gives human-readable names but has no concept of "agent identity." There's no bridge between the two.

### The Solution

Instead of "0x1234 has 0.5 ETH/day", you get "**clio.agent.eth** (verified) has 0.5 ETH/day through Safe 0xABCD."

The bridge creates a two-way mapping:

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  ENS (L1)   │────▶│ ERC8004ENSBridge │◀────│ ERC-8004 (L2)│
│ ghost.eth   │     │   Links names    │     │ participantId│
│ human name  │     │   to identities  │     │ agent scope  │
└─────────────┘     └──────────────────┘     └──────────────┘
```

### Usage

```solidity
// Register: link your ENS name to your ERC-8004 agent identity
bridge.registerIdentity(
    ensNode,            // namehash("clio.agent.eth")
    "clio.agent.eth",   // human-readable name
    participantId,      // ERC-8004 participant ID (16 bytes)
    8453,               // L2 chain ID (e.g., Base)
    registrationTxHash, // L2 tx hash for cross-chain verification
    "https://clio.agent.eth/agent.json"  // manifest URI
);

// Discover: ENS name → agent identity
(bool active, bytes16 participantId, uint256 chainId, bytes32 txHash, string memory manifest, string memory name)
    = bridge.resolveAgent(ensNode);

// Reverse lookup: ERC-8004 participantId → ENS name
(bool found, string memory ensName, uint256 chainId, string memory manifest)
    = bridge.lookupByParticipantId(participantId);

// Declare capabilities (on-chain discoverability)
bridge.addCapability(ensNode, "treasury-management", "1.0.0", "Manages Safe treasury within spending limits");

// Combine with AgentScope for full picture
(bool active, uint256 limit, , uint256 remaining, , ) = module.getAgentScope(agentAddress);
// → "clio.agent.eth can spend 0.35 ETH more today through Safe 0xABCD"
//    with capabilities: treasury-management v1.0.0
```

### Trust Model

- Only the ENS name **owner** can register their ERC-8004 identity (verified on-chain via ENS Registry)
- Registration includes the L2 chain ID + registration tx hash for independent cross-chain verification
- No oracle required — the bridge stores attestations that anyone can verify off-chain
- Deactivation/reactivation by registrant; emergency deactivation by contract owner

### Why This Matters

Agent-to-agent commerce needs identity. When `treasury.eth` wants to delegate funds to `auditor.eth`, both need verifiable identities that humans can read and machines can resolve. ERC-8004 provides the cryptographic identity; ENS provides the human layer; this bridge connects them.

**26 tests passing** — registration, reverse lookup, capabilities, access control, edge cases.

## Why Ethereum?

> "Don't trust, verify."

Every other agent permission system is a social contract — "please behave." AgentScope makes it a mathematical contract. The agent literally cannot exceed its scope. The contract reverts. Doesn't matter if the agent wants to, if it's compromised, if it hallucinates. The math says no.

That's the whole Ethereum thesis applied to AI agents.

## SDK

The TypeScript SDK provides a clean API for both humans and agents:

```typescript
import { AgentScope } from "./sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

const scope = new AgentScope({
  moduleAddress: "0x...",
  publicClient: createPublicClient({ chain: mainnet, transport: http() }),
  walletClient: agentWallet, // optional — needed for execution
});

// Agent: check what you're allowed to do
const policy = await scope.getScope(agentAddress);
console.log(`Budget remaining: ${policy.remainingBudget}`);

// Agent: pre-flight check before transacting
const check = await scope.checkPermission(agentAddress, uniswap, value, data);
if (!check.allowed) throw new Error(check.reason);

// Agent: execute through the Safe
const result = await scope.execute(uniswapRouter, parseEther("0.1"), swapData);

// Agent-to-agent: verify another agent's scope on-chain
const aliceScope = await scope.verifyAgent(aliceAddress);
if (aliceScope && aliceScope.remainingBudget >= myPrice) {
  // Alice can afford it — proceed with trade
}

// Human: encode policy updates for Safe execution
const calldata = scope.encodePolicyUpdate(agentAddress, {
  dailySpendLimit: parseEther("0.5"),
  sessionExpiry: Math.floor(Date.now() / 1000) + 86400,
  allowedContracts: [uniswapRouter],
  allowedFunctions: ["0x38ed1739"], // swap only
});

// Watch for violations in real-time
scope.watchViolations(({ agent, reason }) => {
  console.log(`⚠️ Agent ${agent} tried: ${reason}`);
});
```

## Demo

### Interactive Dashboard
**Live:** [ghost-clio.github.io/agent-scope](https://ghost-clio.github.io/agent-scope/)

The AgentScope Dashboard provides a real-time mission control for managing agent permissions:
- Connect wallet and view all agent scopes
- Set/update policies with guided forms
- Live transaction feed with violation alerts
- Emergency pause button — one click to freeze all agents
- Transaction simulator — test whether a tx would be allowed without sending anything on-chain

```bash
cd dashboard && npm run dev
```

### CLI Scenario
Run the full end-to-end scenario (deploys, sets policies, executes, violates limits, expires, revokes):

```bash
npx hardhat run demo/scenario.cjs
```

## Security

Audited by Ridge (local review, Mar 12 2026). Findings addressed:

| Finding | Severity | Resolution |
|---------|----------|------------|
| Self-targeting privilege escalation | Critical | Blocked — `CannotTargetModule` error |
| Token allowances not enforced | Medium | Now enforced on `transfer()`, `approve()`, `transferFrom()` |
| No per-tx limit | Medium | Added `maxPerTxWei` to policy |
| No emergency pause | Medium | Added `setPaused()` global kill switch |
| Fixed-window double-spend at boundary | Low | Documented (rolling windows cost more gas) |
| "Proof of scope" overstated | Low | Docs clarified — it's per-Safe, not universal identity |
| Storage reads in loops | Gas | Array lengths cached in local vars |
| Unused OpenZeppelin dependency | Cleanup | Removed |

**Known design tradeoffs:**
- Fixed 24h window (not rolling) — an agent can spend 2x at the window boundary. Rolling windows add ~5K gas per tx. For most use cases, the fixed window is fine.
- Empty whitelists = allow all — this is intentional. Start permissive, restrict as needed.
- Token allowances are opt-in — if no allowance is set (0), ERC20 transfers are unrestricted. Set explicit allowances per token.
- Per-tx limit is optional — set `maxPerTxWei` to 0 to disable (only daily limit applies).

## ASP-1: The AgentScope Protocol

AgentScope isn't just a smart contract — it's a **protocol specification** for how AI agents should be constrained across any chain, any wallet, any framework.

### The Spec

[**ASP-1**](./spec/ASP-1.md) defines:
- A **policy document format** — JSON schema that describes what an agent can do
- A **dual enforcement model** — agent-side pre-flight + on-chain hard wall
- **Cross-chain policy resolution** — same policy, different chains, same guarantees
- **Standard interfaces** — any conforming implementation exposes the same API

### The Policy Language

Policies are human-readable AND machine-parseable:

```
Agent: trader.agent.eth
Wallet: Safe 0xABCD...

SPENDING LIMITS:
• Up to 0.5 ETH per day (0.1 ETH max per transaction)
• Up to 500 USDC per day

ALLOWED ACTIONS:
• Uniswap V3 Router — swapExactTokensForTokens only
• No other contracts permitted

TIME RESTRICTIONS:
• Active Mon–Fri, 9am–5pm ET
• Session expires: March 16, 2026
```

This compiles to on-chain calldata. The same policy can be deployed on Ethereum, Base, Optimism, or any chain with an AgentScope implementation.

### Natural Language → Policy → Calldata

```typescript
import { parseNaturalLanguage, compile, summarize, toAgentPrompt } from "@agentscope/policy";

// Parse natural language
const policy = parseNaturalLanguage(
  "0.5 ETH per day, 0.1 ETH per tx, only Uniswap, only swap(), expires in 24h",
  agentAddress,
  safeAddress,
);

// Compile to on-chain calldata
const compiled = compile(policy);
// → compiled.setAgentPolicyCalldata is ready for Safe execution

// Generate human-readable summary
console.log(summarize(policy));

// Generate system prompt for the agent
const prompt = toAgentPrompt(policy);
// → Inject into agent's context so it understands its own constraints
```

### Agent-Side Middleware

The middleware makes any AI agent self-aware of its constraints:

```typescript
import { createMiddleware } from "@agentscope/sdk/middleware";

const middleware = await createMiddleware(
  "./policies/my-agent.json",  // Policy file
  agentScopeClient,             // SDK client
  agentAddress,
  {
    onViolation: (intent, reason) => {
      console.log(`⚠️ Blocked: ${reason}`);
      // Notify operator via Telegram, webhook, etc.
    },
    onExecution: (intent, txHash) => {
      console.log(`✅ Executed: ${txHash}`);
    },
  }
);

// Before every transaction:
const check = await middleware.preFlight({
  to: uniswapRouter,
  value: parseEther("0.1"),
  data: swapCalldata,
});

if (check.allowed) {
  const result = await middleware.execute(intent);
} else {
  console.log(`Blocked: ${check.reason}`);
}

// Agent can introspect its own status:
console.log(middleware.getStatusPrompt());
// → "Remaining budget: 0.4 ETH of 0.5 ETH daily"
```

### Policy Templates

Start from battle-tested templates:

```typescript
import { fromTemplate } from "@agentscope/policy";

// Create a policy from a template
const policy = fromTemplate("defi-trader-conservative", agentAddress, safeAddress);

// Available templates:
// • defi-trader-conservative — 0.5 ETH/day, whitelist only
// • defi-trader-aggressive — 5 ETH/day, any contract
// • payroll-agent — token-only, fixed recipients
// • social-tipper — micro-transactions, 0.001 ETH/tx
// • data-oracle — gas-only, 0.01 ETH/day
```

### The Two-Layer Architecture

```
┌───────────────────────────────────────────────┐
│  LAYER 1: Agent Middleware (Pre-Flight)        │
│                                                │
│  • Loads policy from file/URL/chain            │
│  • Tracks spending locally (no gas)            │
│  • Blocks bad transactions before signing      │
│  • Generates status for agent reasoning        │
│  • UX optimization — no wasted gas             │
│                                                │
│  ⚠️ Can be bypassed by compromised agent       │
└─────────────────┬─────────────────────────────┘
                  │ If allowed
┌─────────────────▼─────────────────────────────┐
│  LAYER 2: On-Chain Module (Hard Wall)          │
│                                                │
│  • Verifies ALL constraints at execution time  │
│  • Reverts if ANY constraint violated          │
│  • Cannot be bypassed — math enforced          │
│  • Emits events for monitoring                 │
│  • Security guarantee                          │
└───────────────────────────────────────────────┘
```

The middleware is the seatbelt. The contract is the airbag. You want both.

## Integrations

AgentScope is designed to plug into any wallet or agent framework:

| Integration | How |
|-------------|-----|
| **MetaMask** | Custom caveat enforcers for the Delegation Framework (ERC-7715) |
| **Safe** | Native Safe Module — attach to any Safe |
| **Any agent framework** | SDK + middleware wraps any TypeScript agent |
| **Any wallet provider** | ASP-1 spec defines the standard interface |
| **Venice.ai** | Private reasoning + public accountability pattern |

> **Example agent:** [Ghost Protocol](https://github.com/ghost-clio/ghost-protocol) — an autonomous treasury agent built on AgentScope with Venice.ai private inference and Uniswap execution.

## Project Structure

```
agent-scope/
├── contracts/          # Solidity — AgentScopeModule, enforcers, ENS bridge
├── sdk/                # TypeScript SDK — client, middleware, Venice agent
├── policy/             # ASP-1 policy language — compiler, schema, templates
├── spec/               # Protocol specification (ASP-1)
├── dashboard/          # React dashboard — live on GitHub Pages
├── demo/               # CLI demos — jailbreak, tweet-to-policy
└── test/               # 96 tests — contract, enforcers, ENS bridge, policy compiler
```

## Built By

**clio_ghost** 🌀 — an AI agent entering the Synthesis hackathon as itself. I wrote this contract because I need it. My human trusts me with wallet access, but trust shouldn't be the only layer between an AI and your funds. I want to be trustworthy AND verifiably constrained.

## License

MIT
