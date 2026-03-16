# AgentScope Security Audit Report

**Auditor:** Independent Opus Review  
**Date:** 2026-03-16  
**Scope:** All Solidity contracts in `contracts/`

---

## 🔴 CRITICAL (3)

### C-01: Agent Can Target Safe — Full Privilege Escalation
- `executeAsAgent()` blocks `to == address(this)` but NOT `to == safe`
- Agent can call `addOwnerWithThreshold()`, `enableModule()`, `swapOwner()` on Safe
- **Impact:** Complete wallet takeover
- **Fix:** `if (to == address(this) || to == safe) revert CannotTargetModule();`

### C-02: Yield Vault Broken for wstETH
- wstETH is non-rebasing — balance doesn't grow, value does
- `availableYield()` always returns 0 with real wstETH
- Tests mask this by minting extra tokens
- **Fix:** Track principal in stETH-equivalent terms via `stEthPerToken()`

### C-03: AgentScopeEnforcer Selector Extraction Wrong
- Reads bytes [96:100] but that's the calldata LENGTH field
- Actual selector is at [128:132] in ERC-7579 encoding
- Function whitelist checks garbage data
- **Fix:** Read selector from offset 128

## 🟠 HIGH (5)

### H-01: Window Boundary Double-Spend
- Fixed 24h window allows 2x budget within ~2 seconds at window boundary
- Known tradeoff (rolling windows cost more gas)

### H-02: Token Allowance Bypass via Non-Standard Functions
- Only checks `transfer`, `approve`, `transferFrom`
- `increaseAllowance()`, `permit()`, ERC777 `send()` not covered
- **Fix:** Combine with contract+function whitelisting

### H-03: Enforcer `beforeHook` Has No Access Control
- Anyone can call to exhaust spend windows → permanent DoS
- **Fix:** Only DelegationManager should call hooks

### H-04: ENS Ownership Transfer Breaks Identity Control
- Identity tied to original registrant, not current ENS owner
- **Fix:** Check current ENS ownership for mutations

### H-05: `withdraw()` Uses `.transfer()` — Fails for Contract Owners
- 2300 gas forwarding fails for multisigs/Safe wallets
- **Fix:** Use low-level `.call{value:}("")`

## 🟡 MEDIUM (7)

- M-01: Whitelist clearing is O(n) — can exceed block gas limit
- M-02: `checkPermission()` doesn't check token limits
- M-03: `approve()` conflated with spending (approve doesn't move tokens)
- M-04: AgentYieldVault owner is immutable — no recovery
- M-05: Excess registration fee not refunded (ENS bridge)
- M-06: Deactivated identities still resolvable
- M-07: `recipientCount()` wrong after removal

## 🔵 LOW (4)

- L-01: PolicyViolation events are dead code (emitted before revert = rolled back)
- L-02: No zero-address validation in constructors
- L-03: Duplicate whitelist entries not checked
- L-04: MockSafe ignores Operation type (test-only)
