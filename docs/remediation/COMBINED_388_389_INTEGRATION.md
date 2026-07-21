# Combined #388 + #389 integration (ephemeral — not pushed)

**Date:** 2026-07-21  
**Method:** disposable local worktree from `origin/main` @ `7009e9de` → merge #388 → merge #389 — **not pushed**, no extra PR.

## Tips combined

| Input              | SHA                                        |
| ------------------ | ------------------------------------------ |
| main               | `7009e9de7c815267577404c324231c504077372e` |
| #388               | `6b70fbd5ae14e0326e3d637d71ccf571929ed966` |
| #389 (pre-fix tip) | `b3e9bbdfa45919b8d784cfdbec19f095eb3ef9bb` |

## Conflicts

| File                               | Resolution                                      | Owner             |
| ---------------------------------- | ----------------------------------------------- | ----------------- |
| `app/layout.tsx`                   | Auto-merged: CSP nonce + panel/AccessiBe mutex  | both (compatible) |
| `ACCESSIBILITY_WIDGET_DECISION.md` | Took **#389** (full privacy/cut-over pack)      | #389              |
| `OWNER_ACTION_REQUIRED_OPS.md`     | Took **#388** (charter-linked A–F release pack) | #388              |
| `GEOSCAPE_TRAIN_RETARGET.md`       | Took **#388** (fuller sequence)                 | #388              |

## Defect found

| Defect                                                                 | Combo | Ownership                     | Fix                                                                                            |
| ---------------------------------------------------------------------- | ----- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Panel pre-hydration inline `<script>` lacked `nonce` under CSP enforce | D     | **#389** (panel script owner) | Soft `x-nonce` attach when `MAPABLE_CSP_ENFORCE_PREVIEW=true`; avoid `headers()` when flag off |

## Automated checks on combined tree

| Check                                                                                                 | Status                              |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Flag matrix A–D (unit)                                                                                | `VERIFIED`                          |
| Layout mutex + nonce source contract                                                                  | `VERIFIED`                          |
| CSP gate / report sink / panel / health / pilot baseline unit                                         | `VERIFIED`                          |
| format:check / lint / production-claims / feature-deps / domain ownership / controlled-pilot baseline | `VERIFIED`                          |
| type-check (after NODE_ENV-safe matrix test)                                                          | re-run on tip                       |
| Full Vitest / production build / Playwright CSP+panel / Accessibility E2E                             | see tip CI / local notes            |
| Vercel Preview four-way matrix                                                                        | `NOT_RUN` / `OWNER_ACTION_REQUIRED` |
| Human a11y / privacy review                                                                           | `NOT_RUN`                           |

## Owner dual-flag Preview

Still `NOT_RUN` until owner sets Preview env and records evidence. Leave both flags **off** in production.

## Rollback

Discard combined Preview env; redeploy with flags unset; revert #389 tip if needed.
