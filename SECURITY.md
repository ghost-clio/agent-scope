# Security

Reviewed by Ridge (local review, Mar 12 2026).

## Findings

| Finding | Severity | Resolution |
|---------|----------|------------|
| Self-targeting privilege escalation | Critical | Blocked — `CannotTargetModule` error |
| Token allowances not enforced | Medium | Enforced on `transfer()`, `approve()`, `transferFrom()` |
| No per-tx limit | Medium | Added `maxPerTxWei` to policy |
| No emergency pause | Medium | Added `setPaused()` global kill switch |
| Fixed-window double-spend at boundary | Low | Documented (rolling windows cost more gas) |
| "Proof of scope" overstated | Low | Docs clarified — per-Safe, not universal |
| Storage reads in loops | Gas | Array lengths cached in local vars |

## Design Tradeoffs

- **Fixed 24h window (not rolling):** Agent can spend 2x at window boundary. Rolling adds ~5K gas/tx.
- **Empty whitelists = allow all:** Start permissive, restrict as needed.
- **Token allowances opt-in:** If no allowance set (0), ERC20 transfers unrestricted.
- **Per-tx limit optional:** Set `maxPerTxWei` to 0 to disable.

## Reentrancy Protection

- `nonReentrant` on `executeAsAgent()`
- CEI (Checks-Effects-Interactions) pattern
- O(1) whitelist lookups via mappings
