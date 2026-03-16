# @ghost-clio/agent-scope-sdk

TypeScript SDK for **AgentScope** — on-chain spending policies for AI agent wallets.

## Install

```bash
# Clone the repo — SDK is not yet published to npm
git clone https://github.com/ghost-clio/agent-scope.git
cd agent-scope/sdk
npm install
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

## Solana SDK

The Solana SDK provides the same API surface for the Anchor program:

```typescript
import { AgentScopeSolana } from "@ghost-clio/agent-scope-sdk/solana";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const scope = new AgentScopeSolana({
  program,                    // Anchor Program instance
  owner: ownerKeypair.publicKey,
});

// Initialize vault (PDA)
await scope.initializeVault();
await scope.fundVault(5n * BigInt(LAMPORTS_PER_SOL)); // 5 SOL

// Set agent policy
await scope.setPolicy({
  agent: agentKeypair.publicKey,
  dailyLimitLamports: 2n * BigInt(LAMPORTS_PER_SOL),  // 2 SOL/day
  perTxLimitLamports: BigInt(LAMPORTS_PER_SOL) / 2n,  // 0.5 SOL/tx
  sessionExpiry: Math.floor(Date.now() / 1000) + 86400, // 24h
  allowedPrograms: [raydiumProgram],
});

// Agent: check + execute
const check = await scope.checkPermission(agent, 500_000_000n);
if (check.allowed) {
  await scope.executeTransfer(agent, recipient, 500_000_000n);
}

// Agent introspection
console.log(await scope.getStatusPrompt(agent));
// → "Daily limit: 2.0000 SOL, Remaining: 1.5000 SOL"
```

### Solana API

#### Vault
- `initializeVault()` — Create PDA vault
- `fundVault(lamports)` — Deposit SOL
- `getVaultBalance()` — Check balance

#### Policy Management (owner)
- `setPolicy(params)` — Create agent policy
- `updatePolicy(params)` — Update without resetting spend
- `revokeAgent(agent)` — Kill agent permissions
- `setPaused(bool)` — Emergency pause
- `setTokenAllowance(agent, mint, limit)` — SPL token daily limit

#### Agent Execution
- `executeTransfer(agent, recipient, lamports)` — SOL transfer
- `executeCpi(agent, program, data, sol?)` — Cross-program invocation

#### Queries
- `getScope(agent)` — Full policy data + remaining budget
- `checkPermission(agent, amount, program?, discriminator?)` — Client-side pre-flight
- `getStatusPrompt(agent)` — Human-readable status for agent reasoning

### PDA Helpers

```typescript
import { deriveVaultPda, derivePolicyPda, deriveTokenAllowancePda } from "@ghost-clio/agent-scope-sdk/solana";

const [vaultPda] = deriveVaultPda(ownerPubkey);
const [policyPda] = derivePolicyPda(vaultPda, agentPubkey);
const [tokenPda] = deriveTokenAllowancePda(vaultPda, agentPubkey, mintPubkey);
```

## License

MIT
