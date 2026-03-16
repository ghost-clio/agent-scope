# AgentScope — TODO

## Critical Fixes (2 PM cron handles these)
- [ ] C-01: Block `to == safe` in executeAsAgent
- [ ] C-02: Fix yield vault for non-rebasing tokens
- [ ] C-03: Fix enforcer selector offset (96 → 128)
- [ ] H-03: Enforcer access control (only DelegationManager)
- [ ] H-05: ENS bridge withdraw() → use .call instead of .transfer
- [ ] Ghost-protocol: fix placeholder swap calldata
- [ ] Ghost-protocol: fail closed on RPC error
- [ ] Remove dead PolicyViolation events
- [ ] Zero-address checks in constructors
- [ ] checkPermission() add token limit checks

## After Fixes
- [ ] Re-run slither on patched contracts
- [ ] Re-run full test suite (target: all green)
- [ ] Update AUDIT-REPORT.md with resolution status
- [ ] Update SECURITY.md with findings + fixes

## Before Mainnet Deploy (Mar 20)
- [ ] Ridge audit (today)
- [ ] All 3 audits clear (opus ✅, flip ✅, ridge ⏳)
- [ ] Contract bytecode frozen — no more changes
- [ ] Verify deployer wallet has enough ETH for 6 L2s
- [ ] Deploy script tested on one more testnet first
- [ ] Verify same address on all mainnets (CREATE2 or nonce matching)

## Before Submission (Mar 22)
- [ ] Demo video (<2 min) — DEMO-SCRIPT.md has the outline
- [ ] SUBMISSION.md finalized — 6 track pitches tight
- [ ] Dashboard verified on mobile (judges might check on phone)
- [ ] All links in README verified (no 404s)
- [ ] .env.example is complete
- [ ] npm install + npm test works clean from fresh clone
- [ ] GitHub repo description + topics set
- [ ] Check Devfolio submission portal is open

## From Extended Opus Audit (add to 2pm cron — new findings)
- [ ] H-02: getAgentScope() + checkPermission() revert on underflow if limit lowered below spent — saturating subtraction fix
- [ ] H-03: removeRecipient() makes whitelist one-way ratchet — add explicit whitelist mode boolean flag
- [ ] M-04: setAgentPolicy resets spend tracking — separate policy config from spend state
- [ ] M-05: _enforceTokenLimit() same underflow risk as H-02 — saturating subtraction
- [ ] M-06: middleware active hours ignores timezone field — use Intl.DateTimeFormat
- [ ] M-01: ENS ensName not validated against ensNode — document or remove ensName field
- [ ] INFO-04: ERC8004ENSBridge.sol duplicated across both repos — sync them

## From Ridge's Audit (add to 2pm cron)
- [ ] Ghost-protocol: default amount fallback `decision.amount || 10` → change 10 to 0.02 ETH
- [ ] Ghost-protocol: rate limit counter never resets → call resetCallCount() on window boundary
- [ ] AgentScopeModule: token allowance=0 means unrestricted — add default-deny toggle or document clearly
- [ ] Solana: add explicit `has_one = agent` constraint to ExecuteTransfer
- [ ] Solana: validate remaining_accounts[0] is actually a TokenAllowance PDA owned by the program

## Polish (if time)
- [ ] Add TypeScript tests for ghost-protocol agent pipeline (flip noted 0 TS tests)
- [ ] Middleware spending tracker persistence (currently in-memory, resets on restart)
- [ ] Policy compiler schema validation
- [ ] Locus integration retry logic
- [ ] Per-function-per-contract whitelist (flip H-note: can't restrict fn X to contract Y only)
- [ ] Consider rolling windows vs fixed (documented tradeoff, not changing)
- [ ] ENS bridge: check current owner for mutations, not just original registrant
