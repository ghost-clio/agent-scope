# Architecture

## Two-Layer Enforcement

```
┌───────────────────────────────────────────────┐
│  LAYER 2: Agent Middleware (Pre-Flight)        │
│  • Loads policy from file/URL/chain            │
│  • Tracks spending locally (no gas)            │
│  • Blocks bad transactions before signing      │
│  ⚠️ Can be bypassed by compromised agent       │
└─────────────────┬─────────────────────────────┘
                  │ If allowed
┌─────────────────▼─────────────────────────────┐
│  LAYER 1: On-Chain Module (Hard Wall)          │
│  • Verifies ALL constraints at execution time  │
│  • Reverts if ANY constraint violated          │
│  • Cannot be bypassed — math enforced          │
└───────────────────────────────────────────────┘
```

The middleware is the seatbelt. The contract is the airbag. You want both.

## Execution Flow

```
Human sets policy via Safe
    ↓
Agent calls executeAsAgent(target, value, data)
    ↓
AgentScopeModule checks:
  ✓ Agent is authorized
  ✓ Not paused
  ✓ Session not expired
  ✓ Target in contract whitelist
  ✓ Function selector in whitelist
  ✓ Value ≤ per-tx limit
  ✓ Daily spend + value ≤ daily limit
  ✓ ERC20 allowance not exceeded
    ↓
Safe.execTransactionFromModule(target, value, data)
    ↓
On-chain execution
```

## Agent-to-Agent Trust

When Agent A talks to Agent B, B can call `getAgentScope(A)` on-chain:

```solidity
(bool active, uint256 limit, uint256 expiry, uint256 remaining,,) = module.getAgentScope(agent);
```

This proves A has spending authority through a specific Safe, with verified budget remaining. No centralized registry. No API keys. Just math.

## Policy Language

Policies are human-readable AND machine-parseable:

```
"0.5 ETH per day, 0.1 ETH per tx, only Uniswap, only swap(), expires in 24h"
```

This compiles to on-chain calldata via the [policy compiler](../policy/compiler.ts).

## MetaMask Delegation

Custom caveat enforcers for ERC-7715:

- **AgentSpendLimitEnforcer**: Rolling 24h spend windows (novel vs built-in cumulative-only)
- **AgentScopeEnforcer**: Composite — spend + whitelist + pause in one enforcer

## ERC-8004 ENS Bridge

Links ERC-8004 agent identities to ENS names:

```
ENS (L1) ──▸ ERC8004ENSBridge ◀── ERC-8004 (L2)
ghost.eth     links names         participantId
```

Forward lookup, reverse lookup, trust scoring, capability declarations.

## Venice Integration

```
Venice (private) → AgentScope (public) → Safe (execution)
```

Agent reasons privately via Venice (zero data retention). Actions are auditable on-chain. You see WHAT happened, never WHY.

## Solana Program

Full EVM parity via Anchor:

| Feature | EVM | Solana |
|---------|-----|--------|
| Vault | Safe multisig | PDA vault |
| Spend limits | ETH (wei) | SOL (lamports) |
| Contract filter | Address array | Pubkey array |
| Function filter | bytes4 selectors | 8-byte discriminators |
| Execution | Safe module | CPI with PDA signing |
| Verification | `getAgentScope()` | `get_agent_scope` |

17 tests. Same protocol (ASP-1), native architecture.
