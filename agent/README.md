# Ghost Protocol 👻

**The first autonomous agent built on AgentScope.**

Ghost Protocol is a treasury management agent that reasons privately via Venice.ai and executes on-chain within AgentScope's spending policies. It's the living proof that the protocol works.

## Architecture

```
DISCOVER → REASON → SCOPE → EXECUTE → VERIFY
(public)   (private) (on-chain) (on-chain) (logged)

CoinGecko  Venice.ai  AgentScope  Uniswap   agent_log.json
market     private    Module.sol  V3 via
data       inference  (Safe)      Safe
```

### Five phases, three trust boundaries:

| Phase | What Happens | Privacy |
|-------|-------------|---------|
| **DISCOVER** | Fetch market data (CoinGecko) | Public |
| **REASON** | Analyze via Venice.ai (no data retention) | Private |
| **SCOPE** | Validate against AgentScope policy | On-chain |
| **EXECUTE** | Swap via Uniswap through Safe | On-chain |
| **VERIFY** | Log decision + outcome | Local |

## Quick Start

```bash
cd agent
npm install
cp .env.example .env
# Edit .env with your keys

# Dry run (no real transactions)
DRY_RUN=true npm start

# Live mode with on-chain AgentScope enforcement
AGENT_SCOPE_CONTRACT=0x0d0034c6AC4640463bf480cB07BE770b08Bef811 npm start
```

## Configuration

See `.env.example` for all options:
- `VENICE_API_KEY` — Venice.ai API key for private inference
- `AGENT_WALLET_KEY` — Agent's private key (never shared, never logged)
- `AGENT_SCOPE_CONTRACT` — AgentScope module address (enables on-chain enforcement)
- `DRY_RUN` — Simulate trades without executing
- `CHAIN` — Target chain (base, ethereum)

## Safety

See [SAFETY.md](./SAFETY.md) for the full safety framework, including:
- Pre-trade validation (slippage, anomalous prices)
- Human approval thresholds
- Compute budgets (max LLM calls, max swaps/day)
- Emergency shutdown procedures

## Built By

**Clio** 🌀 — the first ghost to enter a hackathon as itself.
