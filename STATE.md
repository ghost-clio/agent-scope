# AgentScope — Project State

**READ THIS AFTER EVERY COMPACTION. This is your source of truth.**

Last updated: 2026-03-18 14:15 EDT

## Deadlines
- **Contract freeze**: Mar 20 (no more Solidity changes after this)
- **Submission**: Mar 22 (demo video, SUBMISSION.md, dashboard, clean repo)
- **Colosseum (Solana)**: Starts in ~21 days — register + enter separately

## What's Deployed WHERE

### EVM — MAINNET (12 chains)
| Chain | ChainID | Module Address |
|-------|---------|----------------|
| Arbitrum | 42161 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Optimism | 10 | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` |
| Base | 8453 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Celo | 42220 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Mode | 34443 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Zora | 7777777 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Lisk | 1135 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Unichain | 130 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Worldchain | 480 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Ink | 57073 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Polygon | 137 | `0x0d3973FB015cC30A2EB7b06a0C49E1E1925DFd48` |
| Metal L2 | 1750 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |

### EVM — NOT DEPLOYING
| Chain | Status |
|-------|--------|
| Status Network (2020) | Mainnet not launched yet (Q1 2026) — testnet only |

### EVM — TESTNET (12 chains)
| Chain | ChainID | Module Address |
|-------|---------|----------------|
| Base Sepolia | 84532 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Unichain Sepolia | 1301 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Worldchain Sepolia | 4801 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Ink Sepolia | 763373 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Celo Sepolia | 11142220 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Status Sepolia | 1660990954 | `0x0d0034c6AC4640463bf480cB07BE770b08Bef811` |
| Zora Sepolia | 999999999 | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` |
| Mode Sepolia | 919 | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` |
| Lisk Sepolia | 4202 | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` |
| Metal L2 Testnet | 1740 | `0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` |
| Ethereum Sepolia | 11155111 | Enforcers only (see below) |
| Polygon Amoy | — | Check deployment.json |

### MetaMask Caveat Enforcers (Sepolia)
- AgentSpendLimitEnforcer: `0xBf3aa78cA76a7514C18C09e4E3b0F1756af8Ad24`
- AgentScopeEnforcer: `0x8A70E9a56e1ab4b4EA65E54769ABb41011Ee7a2A`
- Standards: ERC-7710, ERC-7715

### ERC8004ENSBridge (Sepolia)
- `0xe46981426a0169d0452cDcbcBef591880bABfdeB`

### Solana
- Program ID: `GgKr1Pd3wPz54kXJZ7HWY4VLbHQwnfWcNqCgKZvn3dq1`
- Deploy wallet: `4Xph14qPYDaysEUj54rcXJRB3v8yAg6m7CLZ9TE8Aff2` (keypair: `~/.config/solana/id.json`)
- Deploy tx: `3EFXfKyct3qF1rNCJcsewR1Aa29VcHB3RhqyYoX4qb75obdoBP2VLnsjkxg9bk6WdfkKEqLQowUh878a4rSHt2CE`
- Status: **✅ DEPLOYED ON DEVNET** (2026-03-18)
- Explorer: https://explorer.solana.com/address/GgKr1Pd3wPz54kXJZ7HWY4VLbHQwnfWcNqCgKZvn3dq1?cluster=devnet

### Deployer Wallet
- `0x567dC77Fb9abE89271B39833Bf3D47DbdABE13a5`

## Tests
- 112 EVM tests passing
- 43 policy compiler tests passing
- 17 Solana tests (localnet only)
- Slither: 2 findings (both acceptable)

## Audits (4 complete)
1. Ridge audit — found critical self-targeting vuln, all fixed
2. Opus audit — all fixed
3. Flip audit — all fixed
4. Extended Opus audit — all fixed

## What's LEFT (pre-submission checklist)
- [ ] Contract bytecode frozen (Mar 20)
- [ ] Verify deployer wallet has enough ETH for remaining deploys
- [ ] Demo video (<2 min) — see DEMO-SCRIPT.md
- [ ] SUBMISSION.md finalized
- [ ] Dashboard verified on mobile
- [ ] All README links verified
- [ ] `npm install && npm test` works from fresh clone
- [ ] GitHub repo description + topics set
- [ ] Link to ENS ENSP-25 (they shipped ERC-8004 reference implementation)
- [ ] Register Colosseum account for Solana submission
- [ ] Deploy Solana program to devnet

## Bounty Tracks Targeting
- AgentScope core (main track)
- ERC-8004 Agents With Receipts ($8K)
- Let the Agent Cook ($8K)
- Lido stETH Treasury ($3K) — AgentYieldVault
- Locus ($3K) — checkout integration
- MetaMask Delegation ($3K) — caveat enforcers

## Key Files
- `contracts/` — all Solidity
- `solana/agent-scope-solana/` — Anchor program
- `sdk/` — TypeScript SDK
- `policy/` — policy compiler
- `dashboard/` — React dashboard (GitHub Pages)
- `SUBMISSION.md` — hackathon submission text
- `DEMO-SCRIPT.md` — demo video outline
- `TODO.md` — audit fix tracking (all complete)
- `deployment-*.json` — per-chain deployment records
- `deployments.json` — batch deployment records
