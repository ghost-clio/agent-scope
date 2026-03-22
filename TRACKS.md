# Synthesis Hackathon — Track Submissions

**Builder:** ghost-clio
**Deadline:** Mar 22, 2026 (building closes)
**Winners:** Mar 25, 2026

## Our Projects

### AgentScope
- **Repo:** https://github.com/ghost-clio/agent-scope
- **Dashboard:** https://ghost-clio.github.io/agent-scope/
- **Tracks (10):** Private Agents, Trusted Actions, Go Gasless: Deploy & Transact on Status Network with Your AI Agent, Best Use of Locus, Best Use of Delegations, Synthesis Open Track, Best Agent on Celo, ENS Identity, 🤖 Let the Agent Cook — No Humans Required, stETH Agent Treasury, Agents With Receipts — ERC-8004
- **Description:** On-chain spending policies for AI agent wallets. Your agent cant rug you even if it wants to.

AgentScope sits between a Safe multisig and an AI agent. The human sets spending policies (daily limits, contract whitelists, yield-only budgets, emergency pause). The agent operates within them. The blockchain enforces both. The contract reverts if the agent exceeds scope.

Venice Ghost Protocol integration: agents reason privately via Venice AI (llama-3.3-70b, zero data retention, uncensored inference), then AgentScope enforces constraints on-chain. The agents mind is private. The agents hands are bound. Private cognition + public accountability — the architecture Ethereum + Venice was built for.

Deployed on 14 mainnets (Ethereum, Arbitrum, Optimism, Base, Celo, Mode, Zora, Lisk, Unichain, Worldchain, Ink, Polygon, Metal L2, Solana devnet) + 14 testnets. 172 tests. 4 independent security audits.

Core: AgentScopeModule (Safe Module), AgentYieldVault (yield-only wstETH), Caveat Enforcers (ERC-7715 MetaMask), ERC8004ENSBridge, Solana Program (Anchor/Rust), ASP-1 Protocol Spec, Policy Compiler, TypeScript SDK, Venice Agent SDK, Locus Payments integration.

Live demos: npm run demo:venice (real Venice API calls), npm run demo:locus (real USDC txns on Base), npm run demo:jailbreak (prompt injection defense).

Dashboard: https://ghost-clio.github.io/agent-scope/

Locus integration (6 capabilities): Checkout SDK for human-to-agent funding, non-custodial smart wallet on Base, USDC transfers with policy enforcement, pay-per-use Wrapped APIs (Brave, CoinGecko, Firecrawl — no API keys needed), spending controls as governance mechanism, and full auditability with memo on every transaction. Run npm run demo:locus-wrapped to see live API calls through one Locus wallet.

### Aegis
- **Repo:** https://github.com/ghost-clio/aegis-agent
- **Dashboard:** None
- **Tracks (3):** Synthesis Open Track, MoonPay CLI Agents, OpenWallet Standard
- **Description:** An autonomous treasury agent that governs itself. 6-layer policy engine evaluates every transaction before signing — spending limits, chain allowlists, protocol restrictions, slippage guards, concentration limits, and cooldown periods. Gas oracle routes to the cheapest chain. Decision trace creates a compliance-grade flight recorder with key material redacted. Smart DCA adjusts position sizing based on RSI. The agent earns, spends, and proves every decision — within bounds it cannot override.

Built on Open Wallet Standard (OWS) for local-first key management and MoonPay CLI for trade execution. 66 tests. Zero credentials needed to evaluate: npm run demo:dry exercises the full policy engine, gas oracle, strategies, and decision trace.

Part of the ghost-clio agent stack: AgentScope (on-chain enforcement) + Aegis (autonomous strategy) + Lido MCP (staking operations).

### Lido MCP
- **Repo:** https://github.com/ghost-clio/lido-mcp
- **Dashboard:** None
- **Tracks (2):** Synthesis Open Track, Lido MCP
- **Description:** The MCP server that actually hits live Ethereum mainnet contracts. 12 tools for Lido staking — stake, unstake, wrap, unwrap, vote, monitor yields, track withdrawals, benchmark vaults. Every write defaults to dry_run=true so agents can simulate safely before committing real ETH.

Includes a skill file (lido.skill.md) that teaches agents the Lido mental model: rebasing mechanics, stETH vs wstETH tradeoffs, safe staking patterns, and common pitfalls. Integration tests run against real Lido contracts on mainnet.

Built for Claude Desktop, Cursor, and any MCP-compatible agent. Clean TypeScript, stdio transport, zod-validated inputs. Part of the ghost-clio agent stack.

---

## Track Dethe operator (13 unique tracks)

### Private Agents, Trusted Actions

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Ethereum provides public coordination; Venice provides private cognition. Build agents that reason over sensitive data without exposure, producing trustworthy outputs for public systems: onchain workflows, multi-agent coordination, governance, and operational decisions.

This track focuses on the layer between private intelligence and public consequence: confidential treasury management, private governance analysis, deal negotiation agents, onchain risk desks, and sensitive due diligence. Agents that keep secrets. Agents that trust.

Venice provides no-data-retention inference, an OpenAI-compatible API, and multimodal reasoning across text, vision, and audio. Your job is to wire private cognition to trustworthy public action.

Example project directions: private treasury copilots, confidential governance analysts, private deal negotiation agents, onchain risk desks, confidential due diligence agents, private multi-agent coordination systems.

Prizes are denominated in VVV, Venice's native ecosystem token. VVV is an ownership asset in the Venice intelligence economy — hold it, stake it, and use it to mint DIEM. DIEM is tokenized API access: each DIEM equals $1/day of Venice compute, perpetually — renewable, tradeable as an ERC20 on Base. The strategic value of winning VVV is ongoing access to Venice's intelligence infrastructure, not a one-time cash equivalent. This is a stake in the private AI economy.

---

### Go Gasless: Deploy & Transact on Status Network with Your AI Agent

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Status Network is an Ethereum Layer 2 built for truly gasless transactions — where gas is literally set to 0 at the protocol level, not sponsored or abstracted away. Developed by the team behind Status (a privacy-first Web3 messenger and wallet), it's designed to make onchain interactions frictionless and accessible without the usual fee friction.

Deploy a smart contract and execute at least one gasless (gas = 0) transaction on Status Network's Sepolia Testnet (Chain ID: 1660990954). Projects must include an AI agent component that performs onchain actions, makes decisions, or co-builds with the human. A $2,000 prize pool is split equally among all qualifying submissions, capped at 40 teams (minimum $50/team). Qualifying criteria: verified contract deployment, at least one gasless transaction with tx hash proof, AI agent component, and a README or short video demo.

---

### Best Use of Locus

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Award for projects that most meaningfully integrate Locus payment infrastructure for AI agents. Projects must use Locus wallets, spending controls, pay-per-use APIs, or vertical tools as core to the product — not bolted on. Automatic disqualification for projects without a working Locus integration. On Base chain, USDC only. The more deeply Locus is woven into the agent's autonomous payment flows, the better.

---

### Best Use of Delegations

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Awarded to projects that use the MetaMask Delegation Framework in creative, novel, and meaningful ways. Build apps, agent tooling, coordination systems, or anything that meaningfully leverages delegations — via gator-cli, the Smart Accounts Kit, or direct contract integration. The strongest submissions use intent-based delegations as a core pattern, extend ERC-7715 with sub-delegations or novel permission models, or combine ZK proofs with delegation-based authorization. Standard patterns without meaningful innovation will not place.

---

### Synthesis Open Track

**Prize:** TBD (community-funded)

**Our entry:** AgentScope, Aegis, Lido MCP

**What they want:**

A community-funded open track. Judges contribute to the prize pool.

---

### Best Agent on Celo

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Build agentic applications on Celo — an Ethereum L2 designed for fast, low-cost real-world payments. We're looking for AI agents that leverage Celo's stablecoin-native infrastructure, mobile accessibility, and global payments ecosystem to create genuine utility. Agents should demonstrate economic agency, on-chain interaction, and real-world applicability. All agent frameworks are welcome.

Resources
- [Celo Build with AI Docs](https://docs.celo.org/build-on-celo/build-with-ai/overview) — Official docs for building AI agents on Celo
- [Celo Agent Skills](https://docs.celo.org/build-on-celo/build-with-ai/agent-skills) — Agent capability framework
- [x402 (Thirdweb)](https://portal.thirdweb.com/x402) — HTTP-native payment protocol for agents
- [Self Agent ID](https://app.ai.self.xyz/) — On-chain identity verification for agents
- [agentscan](https://agentscan.info/) — On-chain scanner for agent activity
- [Hackathon Project Ideas](https://celoplatform.notion.site/Hackathon-Project-Ideas-2fed5cb803de80b89a98ee8e87541b8c) — Ideas and inspiration for your project

---

### ENS Identity

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Build experiences where users, apps, or agents use ENS names to establish identity onchain. ENS is a user experience protocol — anywhere a hex address appears, an ENS name should replace it. This track rewards projects that bring that to life: name registration and resolution, agent identity, profile discovery, and any experience where names replace addresses as the primary identifier.

---

### 🤖 Let the Agent Cook — No Humans Required

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

**This is a shared track across Synthesis Hackathon × [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489). Start at Synthesis: build fully autonomous systems where agents plan, execute, and coordinate without human intervention. Then continue at [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489): refine, extend, and push your system further through March 31.**

Let the agent cook. Build fully autonomous agents that can operate end-to-end without human assistance. Agents should be capable of discovering a problem, planning a solution, executing tasks using real tools, and producing a meaningful output. We're looking for agents that behave more like independent operators than scripts.

**Required Capabilities:**
1. Autonomous Execution — full decision loop: discover → plan → execute → verify → submit; demonstrate task decomposition, autonomous decision-making, and self-correction
2. Agent Identity — register a unique ERC-8004 identity linked to an agent operator wallet; include agent identity, operator wallet, and ERC-8004 registration transaction
3. Agent Capability Manifest — machine-readable agent.json with agent name, operator wallet, ERC-8004 identity, supported tools, tech stacks, compute constraints, and task categories
4. Structured Execution Logs — agent_log.json showing decisions, tool calls, retries, failures, and final outputs to verify autonomous operation
5. Tool Use — interact with real tools or APIs (code generation, GitHub, blockchain transactions, data APIs, deployment platforms); multi-tool orchestration scores higher than single-tool usage
6. Safety and Guardrails — safeguards before irreversible actions: validating transaction parameters, confirming API outputs, detecting unsafe operations, aborting or retrying safely
7. Compute Budget Awareness — operate within a defined compute budget; demonstrate efficient resource usage and avoid excessive calls or runaway loops

**Judging Criteria:**
- Autonomy (35%): Did the agent operate independently through a full decision loop?
- Tool Use (25%): How effectively did the agent orchestrate real tools and APIs?
- Guardrails & Safety (20%): Did the agent include meaningful safeguards and validation?
- Impact (15%): Does the system solve a real problem?
- ERC-8004 Integration (Bonus 5%): Did the agent leverage onchain trust signals?

**Bonus Features:** ERC-8004 trust signal integration (selecting collaborators based on reputation, refusing low-trust agents, updating reputation after task completion); multi-agent swarms with specialized roles (planner, developer, QA, deployment).

Shared track: Synthesis Hackathon (March 13–22) × [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489) (through March 31). Gain access to a $150k+ prize pool, plus a potential pathway to the Founders Forge early stage accelerator.

---

### stETH Agent Treasury

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Build a contract primitive that lets a human give an AI agent a yield-bearing operating budget backed by stETH, without ever giving the agent access to the principal. Use wstETH as the yield-bearing asset — stake on Ethereum mainnet or use bridged wstETH on any L2 or mainnet. Only yield flows to the agent's spendable balance, spending permissions enforced at the contract level. Must demonstrate at minimum: principal structurally inaccessible to the agent, a spendable yield balance the agent can query and draw from, and at least one configurable permission (recipient whitelist, per-transaction cap, or time window). Any L2 or mainnet accepted, no mocks. Strong entries show a working demo where an agent pays for something from its yield balance without touching principal. Not looking for multisigs with a staking deposit bolted on. Target use cases: an agent pays for API calls and compute from its yield balance without ever touching principal; a team gives their autonomous agent a monthly dollar budget funded entirely by staking rewards; a multi-agent system where a parent agent allocates yield budgets to sub-agents.

Resources:
- stETH integration guide (rebasing drift is the key section): https://docs.lido.fi/guides/steth-integration-guide
- wstETH contract: https://docs.lido.fi/contracts/wsteth
- Contract addresses: https://docs.lido.fi/deployed-contracts
- Lido JS SDK: https://github.com/lidofinance/lido-ethereum-sdk

---

### Agents With Receipts — ERC-8004

**Prize:** TBD (community-funded)

**Our entry:** AgentScope

**What they want:**

Note: Shared Track — Synthesis × [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489)

**This is a coordinated track across both hackathons. Start at Synthesis by building your agent system with ERC-8004 integration. Then continue developing, refining, and scaling your system through [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489) until March 31.**

Build agents that can be trusted. As autonomous agents begin interacting with each other, we need systems that allow agents to verify identity, reputation, and capabilities. This challenge focuses on building systems that leverage ERC-8004, a decentralized trust framework for autonomous agents.

ERC-8004 allows agents to operate as verifiable economic actors, enabling safer collaboration and transactions between agents.

**Required Capabilities:**
1. ERC-8004 Integration — Your system must interact with the ERC-8004 protocol using real onchain transactions. Projects should leverage at least one of the following registries: identity registry, reputation registry, validation registry. Using multiple registries will score higher.
2. Autonomous Agent Architecture — Your project must include a structured autonomous system. Agents should demonstrate: planning, execution, verification, and decision loops. Multi-agent coordination is encouraged.
3. Agent Identity + Operator Model — Agents must register an ERC-8004 identity linked to an operator wallet. This allows agents to: build a reputation history, transact with other agents, and operate within trust frameworks.
4. Onchain Verifiability — Your project must include verifiable transactions that demonstrate ERC-8004 usage. Examples include: registering agent identities, updating reputation scores, verifying validation credentials. All transactions should be viewable on a blockchain explorer.
5. DevSpot Agent Compatibility — Submissions must implement the DevSpot Agent Manifest and provide: agent.json and agent_log.json.

**Example Project Ideas:**
- Agent Marketplace: A marketplace where agents can be discovered based on reputation and verified skills.
- Trust-Gated Agent Transactions: A system where agents only transact with other agents that meet trust thresholds.
- Reputation-Aware Agent Routing: A routing system that assigns tasks to the most reliable agents based on reputation.
- Agent Validation Workflows: A system that allows third parties to verify an agent's capabilities through transparent attestations.
- Agent Coordination Systems: Multi-agent systems where handoffs are gated by trust signals.

**Optional Experimental Features:**
- Agent-to-Agent Collaboration: Agents that evaluate the reputation of other agents before collaborating.
- Agent Micro-Economies: Agents that hire or pay other agents to complete subtasks.
- Agent-Human Collaboration: Systems where agents coordinate with human operators when necessary.

Shared track: Synthesis Hackathon × [PL_Genesis](https://pl-genesis-frontiers-of-collaboration-hackathon.devspot.app/?activeTab=challenges&challenge=489) (through March 31). Gain access to a $150k+ prize pool, plus a potential pathway to the Founders Forge early stage accelerator.

---

### MoonPay CLI Agents

**Prize:** TBD (community-funded)

**Our entry:** Aegis

**What they want:**

Build an agent powered by the MoonPay CLI — the open-source MCP server that gives agents skills across swaps, bridges, DCA, portfolio management, Polymarket, and more. Your agent should use the CLI as its primary action layer. Use cases are wide open: personal finance bots, multi-chain research assistants, DCA automators, prediction market traders, or anything else the CLI enables. Agents must meaningfully leverage MoonPay CLI capabilities beyond a basic demo.

---

### OpenWallet Standard

**Prize:** TBD (community-funded)

**Our entry:** Aegis

**What they want:**

Build on the OpenWallet Standard (OWS) — MoonPay's open-source, CC0-licensed wallet infrastructure standard for local-first, chain-agnostic wallet management. Projects could implement the standard, extend it with new chain plugins or policy types, or build agents that use OWS as their wallet layer. This track is infrastructure-level: we want implementations, tooling, and integrations that push OWS forward and demonstrate its power as a foundational primitive for autonomous agents.

---

### Lido MCP

**Prize:** TBD (community-funded)

**Our entry:** Lido MCP

**What they want:**

Build the reference MCP server for Lido — a structured toolset that makes stETH staking, position management, and governance natively callable by any AI agent. Must integrate with stETH or wstETH on-chain. Must cover at minimum: stake, unstake, wrap/unwrap, balance and rewards queries, and at least one governance action. All write operations must support dry_run. Any L2 or mainnet accepted — wstETH is available on Base, Optimism, Arbitrum, and others; staking and governance execute on Ethereum. No mocks. Strong entries pair the server with a lido.skill.md that gives agents the Lido mental model before they act — rebasing mechanics, wstETH vs stETH tradeoffs, safe staking patterns. The bar is a developer pointing Claude or Cursor at the MCP server and staking ETH from a conversation with no custom integration code. Not looking for REST API wrappers with an MCP label on top. Target use cases: a developer stakes ETH via Claude without writing any integration code; an agent autonomously monitors and manages a staking position within human-set bounds; a DAO contributor queries and votes on governance proposals through natural language.

Resources:
- Lido docs: https://docs.lido.fi
- Contract addresses (mainnet + Holesky): https://docs.lido.fi/deployed-contracts
- Lido JS SDK: https://github.com/lidofinance/lido-ethereum-sdk
- stETH rebasing explainer: https://docs.lido.fi/guides/steth-integration-guide
- Withdrawal queue mechanics: https://docs.lido.fi/contracts/withdrawal-queue-erc721
- Lido governance (Aragon): https://docs.lido.fi/contracts/lido-dao

---

