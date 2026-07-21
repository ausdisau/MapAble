# Ephemeral #388 + #389 current-tip integration (local only)

**Date:** 2026-07-21 (updated after Playwright diagnosis)  
**Not pushed.** Construction: worktree from `origin/main` → merge #388 → merge #389.

| Input                      | SHA                                        |
| -------------------------- | ------------------------------------------ |
| main                       | `7009e9de7c815267577404c324231c504077372e` |
| #388 (pre-harness fix tip) | `d6325c3973e4f1d1d6ba9e12ea1be0e0249bcde6` |
| #389 after soft-compat fix | `098512d39c702f11c6f6e6528001518a1ec197d7` |

## Conflicts

| File                               | Resolution                                                                                       | Owner |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| `app/layout.tsx`                   | Auto then manual: #388 `resolveScriptNonce` + #389 panel/AccessiBe mutex + nonce on panel script | both  |
| `ACCESSIBILITY_WIDGET_DECISION.md` | #389 full privacy pack                                                                           | #389  |
| `OWNER_ACTION_REQUIRED_OPS.md`     | #388 charter-linked A–F pack                                                                     | #388  |
| `GEOSCAPE_TRAIN_RETARGET.md`       | #388 fuller sequence                                                                             | #388  |

## Defects

| Issue                                                     | Combo | Branch   | Fix                                                                                         |
| --------------------------------------------------------- | ----- | -------- | ------------------------------------------------------------------------------------------- |
| Panel prehydration script missing nonce under CSP enforce | D     | **#389** | Soft `x-nonce` when CSP preview flag on (`098512d3`)                                        |
| CSP Playwright `body` hidden / empty title locally        | B     | **#388** | Build/runtime nonce mismatch: must `build:csp-enforce` before flag-on start; harness assert |

## Results (evidence vocabulary)

| Check                                                                      | Status                                                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Unit flag matrix A–D                                                       | `VERIFIED`                                                                                               |
| Focused security/panel/health/pilot vitest (110)                           | `VERIFIED`                                                                                               |
| format / lint / production-claims / feature-deps / domain / pilot baseline | `VERIFIED`                                                                                               |
| Production build (8GB heap)                                                | `VERIFIED` locally on combine tree                                                                       |
| Curl CSP enforce headers + live health on `next start`                     | `VERIFIED` (ready 503 without DB — fail-closed OK)                                                       |
| Playwright CSP after `build:csp-enforce` (3× clean, 9/9)                   | `VERIFIED` locally — prior `FAILED` was mismatched build (flag-off `.next` + flag-on start), not a flake |
| Four-way Vercel Preview matrix                                             | `NOT_RUN` / `OWNER_ACTION_REQUIRED`                                                                      |
| Full Vitest suite / Semgrep / Accessibility E2E on combine                 | Pending re-run on disposable combine after #388 harness tip                                              |
| Independent human review                                                   | `NOT_RUN`                                                                                                |

## Flag combinations (unit + curl where noted)

| Combo | CSP | Panel | Unit                                 | Notes                                           |
| ----- | --- | ----- | ------------------------------------ | ----------------------------------------------- |
| A     | off | off   | `VERIFIED`                           | AccessiBe path                                  |
| B     | on  | off   | `VERIFIED` unit; curl CSP `VERIFIED` | AccessiBe expected client-side; not in raw HTML |
| C     | off | on    | `VERIFIED`                           | AccessiBe absent (mutex)                        |
| D     | on  | on    | `VERIFIED` unit                      | Prod Vercel CSP still hard-off                  |
