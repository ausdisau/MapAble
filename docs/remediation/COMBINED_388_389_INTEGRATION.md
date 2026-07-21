# Combined #388 + #389 integration (ephemeral)

**Date:** 2026-07-21  
**Method:** local `git worktree` merge of #388 into #389 tip — **not pushed**, no extra PR.

## Merge simulation

| Step                                       | Result                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Base                                       | #389 `db36e15a`                                                                      |
| Merged                                     | #388 `687a4303`                                                                      |
| `app/layout.tsx`                           | Auto-merged: CSP nonce scoped to flag-on **and** first-party panel / AccessiBe mutex |
| `ACCESSIBILITY_WIDGET_DECISION.md`         | add/add conflict — resolved by keeping #389 privacy pack (docs-only)                 |
| Focused vitest (flags + CSP gate + report) | See agent log — record pass/fail below                                               |

## Automated checks on combined tree

| Check                                        | Status                                       |
| -------------------------------------------- | -------------------------------------------- |
| Flag default false                           | `VERIFIED` (unit)                            |
| CSP production hard-off                      | `VERIFIED` (unit)                            |
| Mutual exclusion AccessiBe vs panel (layout) | `VERIFIED` (code review of merged layout)    |
| Full Playwright CSP+panel E2E                | `NOT_RUN` (requires dual-flag build session) |
| Vercel Preview dual-flag                     | `NOT_RUN` / `OWNER_ACTION_REQUIRED`          |

## Owner dual-flag Preview

1. Preview env: `MAPABLE_CSP_ENFORCE_PREVIEW=true`
2. Preview env: `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true`
3. Confirm no `acsbapp.com` requests; panel opens; no CSP break on smoke routes
4. Leave both flags **off** in production

## Rollback

Discard combined Preview env; redeploy with both flags unset.
