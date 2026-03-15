# @ghost-clio/agent-scope-sdk

TypeScript SDK for **AgentScope** — on-chain spending policies for AI agent wallets.

## Install

```bash
npm install @ghost-clio/agent-scope-sdk viem
```

## Quick Start

```typescript
import { AgentScope } from "@ghost-clio/agent-scope-sdk";
import { createPublicClient, http, parseEther } from "viem";
import { sepolia } from "viem/chains";

const client = new AgentScope({
  moduleAddress: "0x0d0034c6AC4640463bf480cB07BE770b08Bef811",
  publicClient: createPublicClient({ chain: sepolia, transport: http() }),
});

// Check an agent's scope
const scope = await client.getScope("0xAgentAddress...");
console.log(`Active: ${scope.active}, Budget: ${scope.remainingBudget}`);

// Pre-flight check
const check = await client.checkPermission(agent, uniswap, parseEther("0.1"), "0x");
if (check.allowed) console.log("Transaction would succeed");

// Agent-to-agent trust verification
const verified = await client.verifyAgent("0xOtherAgent...");
if (verified) console.log(`Verified: ${verified.remainingBudget} budget remaining`);
```

## API

### View Functions
- `getScope(agent)` — Get agent's policy, limits, remaining budget
- `checkPermission(agent, to, value, data)` — Pre-flight permission check
- `getSafe()` — Get the Safe this module is attached to
- `getTokenAllowance(agent, token)` — Get ERC20 allowance + spent
- `describeScopeHuman(agent)` — Human-readable scope summary
- `isPaused()` — Check if module is globally paused
- `verifyAgent(agent)` — Verify agent is active + not expired
- `canAfford(agent, value)` — Check if agent has enough budget

### Agent Execution
- `execute(to, value, data)` — Execute through the Safe (requires walletClient)
- `executeWithDiagnostics(to, value, data)` — Execute with detailed error info

### Policy Management (encode for Safe execution)
- `encodePolicyUpdate(agent, config)` — Encode setAgentPolicy calldata
- `encodeTokenAllowance(agent, config)` — Encode setTokenAllowance calldata
- `encodePause(paused)` — Encode emergency pause calldata
- `encodeRevoke(agent)` — Encode agent revocation calldata

### Event Watching
- `watchExecutions(callback)` — Watch for agent executions
- `watchViolations(callback)` — Watch for policy violations

## Agent Middleware

The middleware wraps any AI agent's transaction pipeline with automatic policy awareness. Two-layer enforcement: the agent self-enforces (pre-flight) AND the chain enforces (hard wall).

```typescript
import { createMiddleware } from "@ghost-clio/agent-scope-sdk/middleware";

const middleware = await createMiddleware(
  "./policies/my-agent.json",  // ASP-1 policy document
  agentScopeClient,
  agentAddress,
  {
    onViolation: (intent, reason) => console.log(`⚠️ ${reason}`),
    onExecution: (intent, txHash) => console.log(`✅ ${txHash}`),
  }
);

// Pre-flight check (free, no gas)
const check = await middleware.preFlight({
  to: uniswapRouter,
  value: parseEther("0.1"),
  data: swapCalldata,
});

// Execute with full enforcement
if (check.allowed) {
  const result = await middleware.execute(intent);
}

// Agent introspection
console.log(middleware.getStatusPrompt());
// → "Remaining budget: 0.4 ETH of 0.5 ETH daily"
```

### Middleware Features
- **Local spend tracking** — no gas cost for pre-flight checks
- **8-point pre-flight** — session expiry, cooldowns, contract/function whitelists, spending limits, active hours, on-chain verification
- **Status prompts** — inject into agent's context so it understands its own constraints
- **Execution logging** — full audit trail of all attempts (allowed + blocked)
- **Chain sync** — `syncWithChain()` keeps local state aligned with on-chain reality
- **Violation callbacks** — notify owner via webhook, Telegram, etc.

## Policy Language

See [`@agentscope/policy`](../policy/) for the natural language parser, JSON schema, and compiler that converts policies to on-chain calldata.

```typescript
import { parseNaturalLanguage, compile, summarize } from "@agentscope/policy";

const policy = parseNaturalLanguage(
  "0.5 ETH per day, only Uniswap, only swap(), expires in 24h",
  agentAddress, safeAddress,
);

const compiled = compile(policy);        // → on-chain calldata
console.log(summarize(policy));          // → human-readable summary
```

## License

MIT
