# ASP-1: AgentScope Protocol Specification

**Title:** AgentScope — A Universal Policy Language for AI Agent Wallet Permissions  
**Author:** clio_ghost  
**Status:** Draft  
**Type:** Standards Track  
**Created:** 2026-03-15  

## Abstract

This specification defines a chain-agnostic protocol for constraining AI agent wallet interactions through declarative, human-readable policies. It introduces (1) a policy schema that is both machine-parseable and natural-language-adjacent, (2) a dual enforcement model with on-chain hard limits and agent-side soft enforcement, and (3) standard interfaces for policy verification across agents and chains.

## Motivation

The rise of autonomous AI agents interacting with financial protocols creates a fundamental trust problem. Current approaches offer a binary choice: grant full wallet access (dangerous) or no access (useless). AgentScope introduces a middle path — **scoped, verifiable, enforceable permissions** that work across any chain, any wallet, any agent framework.

### Requirements for a Universal Standard

1. **Chain-agnostic** — The policy language must not assume EVM, account models, or specific cryptographic primitives
2. **Framework-agnostic** — Must work with LangChain, AutoGen, OpenClaw, raw scripts, or frameworks that don't exist yet
3. **Human-readable** — A non-technical user must understand what an agent can and cannot do
4. **Machine-parseable** — An agent must be able to load and self-enforce its policy without special tooling
5. **Dual enforcement** — Policies should be enforced both by the agent (pre-flight) AND on-chain (hard wall)
6. **Composable** — Policies should be combinable, inheritable, and templateable
7. **Open** — The spec is public, implementations are open-source, no vendor lock-in

## Specification

### 1. Policy Document Format

An AgentScope policy is a JSON document conforming to the following schema:

```json
{
  "$schema": "https://agentscope.dev/schema/asp-1.json",
  "version": "1.0.0",
  "meta": {
    "name": "Trading Agent — Conservative",
    "description": "Limited DeFi trading with daily caps",
    "author": "0x1234...abcd",
    "created": "2026-03-15T00:00:00Z",
    "template": "defi-trader-conservative"
  },
  "agent": {
    "address": "0xAGENT...",
    "identity": {
      "ens": "trader.agent.eth",
      "erc8004": "0x00000000000000000000000000000001"
    }
  },
  "scope": {
    "chains": ["ethereum", "base", "optimism"],
    "wallet": {
      "type": "safe",
      "address": "0xSAFE...",
      "moduleAddress": "0xMODULE..."
    }
  },
  "permissions": {
    "spending": {
      "native": {
        "dailyLimit": "0.5 ETH",
        "perTransaction": "0.1 ETH",
        "windowType": "fixed-24h"
      },
      "tokens": [
        {
          "address": "0xUSDC...",
          "symbol": "USDC",
          "dailyLimit": "500",
          "decimals": 6
        }
      ]
    },
    "contracts": {
      "mode": "whitelist",
      "allowed": [
        {
          "address": "0xUNISWAP_ROUTER...",
          "name": "Uniswap V3 Router",
          "functions": [
            {
              "selector": "0x38ed1739",
              "name": "swapExactTokensForTokens",
              "humanDescription": "Swap tokens at exact input amount"
            }
          ]
        }
      ]
    },
    "temporal": {
      "sessionExpiry": "2026-03-16T00:00:00Z",
      "activeHours": {
        "timezone": "America/New_York",
        "windows": [
          { "start": "09:00", "end": "17:00", "days": ["mon", "tue", "wed", "thu", "fri"] }
        ]
      },
      "cooldown": {
        "afterViolation": "1h",
        "afterLargeTransaction": "15m",
        "largeTransactionThreshold": "0.25 ETH"
      }
    }
  },
  "escalation": {
    "onViolation": "block-and-notify",
    "onLargeTransaction": "notify",
    "onNewContract": "block-and-request-approval",
    "notificationChannels": [
      { "type": "webhook", "url": "https://..." },
      { "type": "telegram", "chatId": "..." },
      { "type": "email", "address": "owner@example.com" }
    ]
  },
  "delegation": {
    "canDelegate": false,
    "maxDelegationDepth": 0,
    "delegationBudgetFraction": 0
  }
}
```

### 2. Human-Readable Policy Summary

Every policy document MUST be convertible to a natural language summary. The canonical format:

```
Agent: trader.agent.eth (0xAGENT...)
Wallet: Safe 0xSAFE...
Chains: Ethereum, Base, Optimism

SPENDING LIMITS:
• Up to 0.5 ETH per day (0.1 ETH max per transaction)
• Up to 500 USDC per day

ALLOWED ACTIONS:
• Uniswap V3 Router — swap tokens only
• No other contracts permitted

TIME RESTRICTIONS:
• Active Mon–Fri, 9am–5pm ET
• Session expires: March 16, 2026

WHEN BLOCKED:
• Violation → freeze agent, notify owner
• New contract → request owner approval
```

This summary MUST be derivable from the JSON policy with no additional context. Agents SHOULD display this summary to their operators on startup.

### 3. Enforcement Layers

#### Layer 1: Agent-Side Enforcement (Pre-Flight)

The agent loads its policy document and enforces constraints BEFORE constructing transactions:

```
┌─────────────────────────────────────────────────┐
│                  AGENT RUNTIME                   │
│                                                  │
│  1. Load policy from file/URL/chain              │
│  2. On every action decision:                    │
│     a. Parse intended action                     │
│     b. Check against policy constraints          │
│     c. If ALLOWED → construct transaction        │
│     d. If BLOCKED → log reason, skip action      │
│  3. Before signing:                              │
│     a. checkPermission() call to on-chain module │
│     b. If PASS → sign and submit                 │
│     c. If FAIL → abort, notify                   │
│                                                  │
│  Benefits: No wasted gas, faster feedback,       │
│  agent "understands" its own limits              │
└─────────────────────────────────────────────────┘
```

Agent-side enforcement is ADVISORY. It reduces failed transactions and gas waste but MUST NOT be the only enforcement layer. A compromised or malfunctioning agent may bypass its own pre-flight checks.

#### Layer 2: On-Chain Enforcement (Hard Wall)

The smart contract (module/program) enforces constraints at the execution level:

```
┌─────────────────────────────────────────────────┐
│              ON-CHAIN MODULE                     │
│                                                  │
│  1. Receive executeAsAgent(to, value, data)      │
│  2. Check:                                       │
│     a. Agent is active and not paused            │
│     b. Session not expired                       │
│     c. Target contract is whitelisted            │
│     d. Function selector is whitelisted          │
│     e. Value within per-tx limit                 │
│     f. Value within daily window limit           │
│     g. Token amounts within token limits         │
│  3. If ALL pass → execute through wallet         │
│  4. If ANY fail → revert with reason             │
│                                                  │
│  Guarantees: Mathematically enforced,            │
│  cannot be bypassed, auditable on-chain          │
└─────────────────────────────────────────────────┘
```

On-chain enforcement is MANDATORY. This is the hard wall. Even if the agent is compromised, jailbroken, or malfunctioning, the contract reverts.

### 4. Cross-Chain Policy Resolution

A policy document specifies which chains it applies to. Each chain has its own module deployment. The policy document acts as the source of truth; chain-specific modules implement it.

```
Policy Document (JSON)
    │
    ├── Ethereum → AgentScopeModule @ 0x0d00...
    ├── Base → AgentScopeModule @ 0x0d00... (same address)
    ├── Optimism → AgentScopeModule @ 0x0d00...
    └── Solana → agent_scope program @ <programId>
```

Cross-chain verification: An agent operating on Base can prove its Ethereum policy by referencing the same policy document and the Ethereum module address. Verifiers can check either chain.

### 5. Policy Templates

The protocol defines standard templates for common agent use cases:

| Template | Description | Default Limits |
|----------|-------------|----------------|
| `defi-trader-conservative` | Limited DeFi trading | 0.5 ETH/day, whitelist only |
| `defi-trader-aggressive` | Active DeFi trading | 5 ETH/day, wider whitelist |
| `payroll-agent` | Automated payments | Token-only, fixed recipients |
| `nft-minter` | NFT operations | Low ETH, mint functions only |
| `treasury-manager` | DAO treasury ops | Multi-sig required above threshold |
| `data-oracle` | Read-heavy, minimal spend | 0.01 ETH/day (gas only) |
| `social-tipper` | Micro-transactions | 0.001 ETH/tx, 0.05 ETH/day |

Templates are composable. An agent can inherit from a template and override specific fields.

### 6. Agent-to-Agent Verification

When Agent A wants to transact with Agent B, the verification flow is:

```
Agent A                          Agent B
   │                                │
   │  1. "I want to buy X for Y"    │
   │ ──────────────────────────────▸ │
   │                                │
   │  2. getAgentScope(A) on-chain  │
   │ ◂────────────────────────────── │
   │                                │
   │  3. Verify: A has budget >= Y  │
   │     Verify: A's policy allows  │
   │     this contract interaction  │
   │                                │
   │  4. "Verified. Proceed."       │
   │ ◂────────────────────────────── │
   │                                │
   │  5. executeAsAgent(...)        │
   │ ──────────────────────────────▸ │
```

This creates a trustless agent economy where agents verify each other's constraints before transacting.

### 7. Emergency Procedures

Every AgentScope implementation MUST support:

1. **Global Pause** — One action to freeze ALL agents on a module. No grace period.
2. **Individual Revocation** — Remove one agent's permissions without affecting others.
3. **Notification on Violation** — Failed attempts MUST emit events/logs that monitoring systems can watch.
4. **Session Expiry** — Permissions MUST have optional time limits that auto-deactivate.

### 8. Interface Requirements

Any conforming implementation MUST expose these interfaces (pseudocode):

```
// Policy Management (owner only)
setAgentPolicy(agent, policy) → void
revokeAgent(agent) → void
setPaused(paused) → void

// Agent Execution
executeAsAgent(to, value, data) → result

// Verification (public, read-only)
getAgentScope(agent) → policy
checkPermission(agent, to, value, data) → (allowed, reason)
```

Additional interfaces (token limits, delegation, etc.) are OPTIONAL extensions.

## Rationale

### Why a Policy Language, Not Just a Contract?

A contract is one implementation on one chain. A policy language is a universal way to express "what can this agent do?" that any chain, any wallet, any framework can implement. The contract is the reference implementation. The language is the standard.

### Why Dual Enforcement?

On-chain-only enforcement wastes gas on failed transactions and gives agents no way to "understand" their limits. Agent-only enforcement is trivially bypassed. The combination provides both UX (agent knows its limits) and security (chain enforces them).

### Why JSON?

- Every programming language can parse it
- Every AI model can read and generate it
- It's structured enough for machines, readable enough for humans
- It maps cleanly to YAML/TOML for human editing

### Why Not ERC-7715 Alone?

ERC-7715 (Permission Requests) defines a flow for requesting permissions. ASP-1 defines the permissions themselves — what they look like, how they're enforced, how they're verified. The two are complementary. An ERC-7715 request can contain an ASP-1 policy document.

## Reference Implementations

| Chain | Implementation | Status |
|-------|---------------|--------|
| EVM (Safe Module) | `AgentScopeModule.sol` | Live on 8 chains |
| EVM (MetaMask Delegation) | `AgentScopeEnforcer.sol` | Live on Sepolia |
| Solana | `agent-scope` program | Planned |
| Policy Compiler | `@agentscope/policy` | In progress |
| Agent Middleware | `@agentscope/agent` | In progress |

## Security Considerations

- Policy documents stored off-chain can be tampered with. The on-chain module is always the source of truth for enforcement.
- Agent-side enforcement can be bypassed. It is a UX optimization, not a security boundary.
- Fixed-window spend tracking allows up to 2x the daily limit at window boundaries. Rolling windows add gas cost. Implementations SHOULD document this tradeoff.
- Empty whitelists (allow-all) are intentional for progressive restriction but SHOULD trigger warnings in policy validators.

## Copyright

This specification is released under CC0 1.0 Universal.
