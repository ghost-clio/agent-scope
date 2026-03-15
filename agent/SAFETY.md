# Safety Architecture — Three Layers, No Overlap

Ghost Protocol has three layers of protection. Each enforces **different things** — they don't overlap.

## Layer 1: AgentScope (On-Chain — Contract Enforced)

**What it enforces:** Spending limits, contract whitelists, function whitelists, session expiry.

**Where:** `AgentScopeModule.sol` deployed on a Gnosis Safe.

**Why on-chain:** These are the rules the LLM CANNOT violate. The smart contract is the execution path — `executeAsAgent()` validates policy before the Safe sends any transaction. There is no bypass. The human sets the policy via `setAgentPolicy()`. The agent cannot modify it.

**Specifically enforces:**
- Daily ETH spending limit (fixed 24h window)
- Per-transaction ETH limit
- Contract address whitelist (e.g., only Uniswap V3 Router)
- Function selector whitelist (e.g., only `exactInputSingle`)
- ERC20 token daily allowances
- Session expiry (auto-revoke after timestamp)
- Global emergency pause
- Self-targeting escalation guard

**Cannot enforce:** Slippage, price impact, confidence thresholds, risk scores — these require off-chain data the contract doesn't have.

## Layer 2: Strategy Limits (JavaScript — Agent Enforced)

**What it enforces:** Execution quality and strategy parameters.

**Where:** `uniswap.ts` (slippage) and `venice.ts` (confidence, risk scoring).

**Why JS:** These checks require off-chain data that contracts can't access — swap quotes, price impact calculations, AI confidence scores. The contract can't see a Uniswap quote response.

**Specifically enforces:**
- Maximum slippage / price impact per swap (1% default)
- Minimum confidence threshold from Venice reasoning
- Maximum risk score threshold
- Calldata validation before routing to Safe

**Cannot enforce:** Spending limits, contract restrictions — that's Layer 1.

## Layer 3: Venice Confidential Reasoning (Trust Assumption)

**What it provides:** Private strategy reasoning — the agent's alpha stays private.

**Where:** `venice.ts` — API calls to Venice.ai with zero-data-retention.

**Trust model:** Venice *promises* no data retention. This is a trust assumption, not a cryptographic guarantee. The architecture is designed so upgrading to TEE/FHE/ZK inference swaps one module, not the system.

## The Execution Flow

```
Venice (private reasoning)
    ↓
Agent decides: BUY 0.01 ETH of USDC
    ↓
uniswap.ts: buildSwapCalldata()     ← Layer 2: checks slippage
    ↓
scope.validate(proposal)             ← Layer 1: checks spending/whitelist
    ↓
scope.execute(proposal, signer)      ← Layer 1: routes through Safe
    ↓
AgentScopeModule.executeAsAgent()    ← Layer 1: contract validates AGAIN
    ↓
Safe.execTransactionFromModule()     ← On-chain execution
    ↓
Uniswap V3 Router.exactInputSingle  ← Actual swap
```

**Key:** In on-chain mode, execution goes through the Safe. The agent CANNOT call Uniswap directly. `executeAsAgent()` is the only execution path, and it re-validates the full policy before allowing the Safe to act.

In local/demo mode, execution is direct (no Safe). This is explicitly labeled in all logs and output as "local fallback — not cryptographically enforced."

## Why Not One Layer?

A single layer would either be too restrictive (on-chain can't check slippage) or too permissive (JS can't guarantee spending limits). The separation is deliberate:

- **On-chain handles what MUST be guaranteed** — money can't leave without contract approval
- **JS handles what NEEDS off-chain data** — execution quality, strategy parameters
- **Venice handles what SHOULD be private** — reasoning, strategy, alpha

No overlap. No confusion. Each layer does what it's best at.
