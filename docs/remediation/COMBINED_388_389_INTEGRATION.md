# Ephemeral #388 + #389 current-tip integration (local only)

**Date:** 2026-07-21 (full combined verification + Playwright diagnosis)  
**Not pushed.** Construction: worktree from `origin/main` → merge #388 → merge #389
(`tmp/combine-388-389-v3`, combined SHA `6fa30076158322034ddf40bdcc57922a551615a1`
after conflict resolution + #389 soft-compat test pull).

| Input                       | SHA                                        |
| --------------------------- | ------------------------------------------ |
| main                        | `7009e9de7c815267577404c324231c504077372e` |
| #388 (CSP harness fix tip)  | `919663d8859a354616b463888611a59617aa03ae` |
| #389 (soft-compat test tip) | `e3459972b4a8cfe2d6c5d33db698060eec041d50` |

## Conflicts (ephemeral combine only — not pushed)

| File                               | Resolution                                                                                     | Owner |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| `app/layout.tsx`                   | #388 `resolveScriptNonce` + #389 panel/AccessiBe mutex + nonce on panel prehydration + JSON-LD | both  |
| `ACCESSIBILITY_WIDGET_DECISION.md` | #389 full privacy pack                                                                         | #389  |
| `OWNER_ACTION_REQUIRED_OPS.md`     | #388 charter-linked A–F pack                                                                   | #388  |
| `GEOSCAPE_TRAIN_RETARGET.md`       | #388 fuller sequence                                                                           | #388  |
| `COMBINED_388_389_INTEGRATION.md`  | #388 evidence record                                                                           | #388  |

## Defects fixed on owning PR branches

| Issue                                                               | Combo | Branch   | Fix commit |
| ------------------------------------------------------------------- | ----- | -------- | ---------- |
| Panel prehydration missing nonce under CSP enforce                  | D     | **#389** | `098512d3` |
| CSP Playwright `body` hidden / empty title (build/runtime mismatch) | B     | **#388** | `919663d8` |
| Combined Vitest soft-compat asserted standalone-only helper name    | —     | **#389** | `e3459972` |

### Playwright root cause (honest)

Flag-on `next start` against a `.next` tree built **without**
`MAPABLE_CSP_ENFORCE_PREVIEW=true` prerenders HTML whose `/_next` scripts lack
per-request nonces. Middleware still emits enforce CSP with a fresh nonce →
scripts blocked / document non-interactive → Playwright reports `body` hidden
and sometimes empty title. **Not a flake.** After `build:csp-enforce`, CSP suite
passed **3× clean (9/9)** and again under matrix B/D. Evidence:
`/tmp/csp-flagbuild-run{1,2,3}.log`, `/tmp/combine-v3-results/matrix/B-pw.log`,
`D-csp-suite.log`.

## Combined-suite results (vocabulary)

| Check                                                                     | Status                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| pnpm install --frozen-lockfile                                            | `VERIFIED`                                                              |
| Prisma validate / generate                                                | `VERIFIED`                                                              |
| migration integrity / order                                               | `VERIFIED`                                                              |
| migrate-from-zero (local)                                                 | `NOT_RUN` — no Docker/Postgres in agent env                             |
| type-check / format:check / lint                                          | `VERIFIED`                                                              |
| production-claims / domain-ownership / feature-deps / pilot baseline      | `VERIFIED`                                                              |
| Full Vitest (clean env)                                                   | `VERIFIED` — 1088 passed; 1 local fail `booking-rag-scope` needs DB     |
| booking-rag-scope without DATABASE_URL                                    | `FAILED` locally (env) — same on #388 alone; CI has Postgres            |
| Security gates (prod-audit, secrets, unsafe-env, route-auth, upload, API) | `VERIFIED`                                                              |
| Semgrep (`semgrep ci` with App token)                                     | `OWNER_ACTION_REQUIRED` locally; **#388/#389 tip CI Semgrep `SUCCESS`** |
| Local `semgrep --config=p/ci` / `semgrep ci --config auto`                | Not CI-parity (tokenless); do not treat as gate                         |
| CSP Playwright after flag-on build                                        | `VERIFIED` (3× + matrix B/D)                                            |
| Automated Accessibility workflow Playwright (`pnpm test:a11y`)            | `NOT_RUN` locally (needs Postgres seed); **#388/#389 tip CI `SUCCESS`** |
| Production build (8GB heap)                                               | `VERIFIED` (default, CSP, panel, both)                                  |
| Four-way Vercel Preview matrix A–D                                        | `NOT_RUN` / `OWNER_ACTION_REQUIRED`                                     |
| Independent human review / golden journeys / apex health / Neon PITR      | `NOT_RUN`                                                               |

## Local flag matrix A–D (synthetic `next start` — not Vercel Preview)

| Combo | CSP | Panel | HTTP/routes | live/ready | CSP headers                     | Panel/AccessiBe                                                        | Playwright                          |
| ----- | --- | ----- | ----------- | ---------- | ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| A     | off | off   | `VERIFIED`  | 200 / 503  | report-only only                | AccessiBe not in SSR HTML (lazy client)                                | body visible (curl+SSR)             |
| B     | on  | off   | `VERIFIED`  | 200 / 503  | enforce + nonce, no unsafe-eval | —                                                                      | CSP suite 9/9 `VERIFIED`            |
| C     | off | on    | `VERIFIED`  | 200 / 503  | report-only                     | prehydration present; AccessiBe absent; keyboard open/close `VERIFIED` | `VERIFIED`                          |
| D     | on  | on    | `VERIFIED`  | 200 / 503  | enforce + nonce                 | panel script nonce matches CSP; AccessiBe absent                       | panel+CSP `VERIFIED`; CSP suite 9/9 |

Hard-off unit: `VERCEL_ENV=production` ⇒ enforce false even if flag true (`VERIFIED`).

## Tip CI (remote — terminal)

| PR   | Tip SHA    | Required checks                                                                                                                     | Draft / mergeable |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| #388 | `919663d8` | CI, Migrations, Migrate from zero, Security, Semgrep, Accessibility, Production claims, CSP enforce preview, Vercel — all `SUCCESS` | draft `MERGEABLE` |
| #389 | `e3459972` | CI, Migrations, Migrate from zero, Security, Semgrep, Accessibility, Production claims, Vercel — all `SUCCESS`                      | draft `MERGEABLE` |

CodeRabbit draft skip ≠ independent approval.
