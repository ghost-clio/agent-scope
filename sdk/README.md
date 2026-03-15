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

## License

MIT
