# AgentScope — TODO

## Audit Fixes — ALL COMPLETE ✅

### Critical (3/3 fixed)
- [x] C-01: Block `to == safe` in executeAsAgent — FIXED (cd71623)
- [x] C-02: Fix yield vault for non-rebasing wstETH — FIXED (cd71623, exchange rate math)
- [x] C-03: Fix enforcer selector offset (96 → 128) — FIXED (cd71623)

### High (8/8 fixed)
- [x] H-02: Saturating subtraction in view functions — FIXED (cd71623)
- [x] H-03: removeRecipient whitelist ratchet — FIXED (whitelistEnabled flag, 5a84572)
- [x] H-05: ENS bridge withdraw() .transfer → .call — FIXED (cd71623)
- [x] Enforcer access control (DelegationManager only) — FIXED (cd71623)
- [x] Ghost-protocol: ETH/USD unit confusion — FIXED (fc626bb, USD→ETH conversion)
- [x] Ghost-protocol: default amount 10 → 0.02 — FIXED (133a46f)
- [x] Ghost-protocol: rate limit counter reset — FIXED (ecc8f9c)
- [x] Ghost-protocol: placeholder swap calldata → proper ABI encoding — FIXED (b724f26)

### Medium (7/7 fixed)
- [x] setAgentPolicy spend reset abuse — FIXED (3e2560a, conditional reset)
- [x] checkPermission() token limit checks — FIXED (48173eb)
- [x] _enforceTokenLimit() saturating subtraction — FIXED (cd71623)
- [x] Middleware active hours timezone — FIXED (a1082d4, Intl.DateTimeFormat)
- [x] Dead PolicyViolation events removed — FIXED (128b38d + 966c758)
- [x] Zero-address checks in constructors — FIXED (cd71623)
- [x] Ghost-protocol: fail closed on RPC error — FIXED (f3b5583)

### Solana (3/3 fixed)
- [x] Validate remaining_accounts[0] as correct PDA — FIXED (956291e)
- [x] Add has_one=agent to ExecuteTransfer + ExecuteCpi — FIXED (956291e)
- [x] Replace checked_add().unwrap() with proper errors — FIXED (956291e)

### Low / Info (documented)
- [x] Token allowance=0 means unrestricted — documented in code (cd71623)
- [x] ERC8004ENSBridge synced across repos — DONE (cd71623)
- [ ] ENS ensName not validated against ensNode — DOCUMENTED (won't fix, consumers should verify)

## Verification
- [x] 112 EVM tests passing
- [x] 43 policy compiler tests passing
- [x] Slither: 2 findings (both acceptable: test mock + intentional strict equality)
- [ ] Solana tests (need anchor build — can't run locally without full Solana toolchain)

## Before Mainnet Deploy (Mar 20)
- [x] All 4 audits complete (opus, flip, ridge, extended opus)
- [x] All critical + high findings fixed
- [ ] Contract bytecode frozen — no more changes after today
- [ ] Verify deployer wallet has enough ETH for 6 L2s
- [ ] Deploy script tested on one more testnet first

## Before Submission (Mar 22)
- [ ] Demo video (<2 min) — DEMO-SCRIPT.md has the outline
- [ ] SUBMISSION.md finalized
- [ ] Dashboard verified on mobile
- [ ] All README links verified
- [ ] npm install + npm test works clean from fresh clone
- [ ] GitHub repo description + topics set
- [ ] Link to ENS ENSP-25 demo (they just shipped an ERC-8004 reference implementation TODAY)

## Colosseum (Solana)
- [ ] Register Colosseum account
- [ ] Enter upcoming hackathon (starts in ~21 days)
- [ ] AgentScope Solana program as standalone submission
