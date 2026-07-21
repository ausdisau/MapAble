# Phase 0 — Rescan reconciliation (2026-07-20)

**Inspection time:** 2026-07-20 (cloud agent rescan)  
**Reference main (prior assessment):** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Current `origin/main`:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Delta vs reference:** **none** — tip unchanged.

Evidence vocabulary for this programme:

| Status                  | Meaning                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `VERIFIED`              | Checked against live repository, CI, or disposable environment evidence |
| `FAILED`                | Check ran and failed                                                    |
| `NOT_RUN`               | Check not executed; must not be treated as pass                         |
| `OWNER_ACTION_REQUIRED` | Needs account-owner / specialist action outside this agent              |
| `BLOCKED`               | Cannot proceed until a named prerequisite clears                        |
| `NOT_APPLICABLE`        | Out of scope for the stated slice                                       |

## Confirmed vs prior known issues

| Prior finding                                                                                    | Current evidence                                                                                                           | Status                                    |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Main tip at `6279ab91`                                                                           | Identical SHA                                                                                                              | `VERIFIED`                                |
| #381 repaired migrate-from-zero                                                                  | Merge commit `78f95d40` is ancestor of `main`; Migrations workflow on `main` **success** after #380/#381                   | `VERIFIED`                                |
| Docs still claim migrate-from-zero broken                                                        | `CURRENT_STATE.md`, `RISK_REGISTER.md` (R24), NDIS delivery/reconciliation still describe P3018 as active empty-DB blocker | `VERIFIED` (stale docs — this PR repairs) |
| Production `_prisma_migrations` drift                                                            | Repair runbook still requires owner checksum update + rename-drift reconciliation; no production mutation performed        | `OWNER_ACTION_REQUIRED`                   |
| PR #382 format:check fail on `DOMAIN_OWNERSHIP.md`                                               | CI job failed at `pnpm format:check` warning that file                                                                     | `FAILED` (still open)                     |
| PR #382 Accessibility OOM ~6 GB                                                                  | Accessibility job OOM during `pnpm build`; workflow already sets `NODE_OPTIONS=--max-old-space-size=6144`                  | `FAILED` (still open)                     |
| Stack #367 → #384 → #385 → #386 depth 4                                                          | All four still OPEN draft; #386 base is #385 tip                                                                           | `VERIFIED` (policy breach)                |
| PR #379 PBS path overlap (`lib/positive-behaviour-support/**` vs Wave 0 `lib/pbs-operations/**`) | #379 still OPEN, CONFLICTING vs `main`, CI/a11y/migrate-from-zero failures                                                 | `VERIFIED`                                |
| Branch protection not API-verified                                                               | Rulesets `[]`; protection endpoint 403 to integration                                                                      | `OWNER_ACTION_REQUIRED`                   |
| CSP report-only + `unsafe-inline` / `unsafe-eval`                                                | `CSP_ENFORCEMENT.md` + `lib/security/headers.ts` unchanged on `main`                                                       | `VERIFIED`                                |
| Manual AT / ops evidence incomplete                                                              | Golden journeys and tabletop exercises not human-completed                                                                 | `NOT_RUN`                                 |

## Open PR inventory (programme-relevant)

| PR   | Draft | Base → Head                     | Mergeable            | Notable checks                         | Stack depth        |
| ---- | ----- | ------------------------------- | -------------------- | -------------------------------------- | ------------------ |
| #367 | yes   | `main` ← geoscape               | MERGEABLE            | CI green                               | 1                  |
| #379 | yes   | `main` ← PBS foundation         | CONFLICTING          | CI/a11y/mfz fail                       | 1                  |
| #382 | yes   | `main` ← AT Continuity          | MERGEABLE / UNSTABLE | CI format fail; a11y OOM; mfz **pass** | 1                  |
| #383 | yes   | `main` ← VisionAccess contracts | MERGEABLE / CLEAN    | CI green                               | 1                  |
| #384 | yes   | #367 ← address intelligence     | MERGEABLE / CLEAN    | CI green                               | 2                  |
| #385 | yes   | #384 ← approach resolver        | MERGEABLE / UNSTABLE | 1 fail (rollup)                        | 3                  |
| #386 | yes   | #385 ← provider service areas   | MERGEABLE / CLEAN    | CI green                               | **4 (over limit)** |

## Stack map

```text
main @ 6279ab91
├── #367 Geoscape G-NAF (depth 1)
│   └── #384 Access Address Intelligence (depth 2)
│       └── #385 Approach resolver (depth 3)
│           └── #386 Provider service areas (depth 4)  ← exceeds MAX=3
├── #382 AT Continuity Wave 1 (depth 1) — CI/a11y red
├── #383 VisionAccess contracts (depth 1)
└── #379 PBS foundation (depth 1) — CONFLICTING; path conflict with Wave 0 plan
```

Independent remediation PRs from this programme must target `main` directly and must **not** deepen the Geoscape train.

## Evidence environment separation

| Layer                       | What it proves                          | What it does not prove              |
| --------------------------- | --------------------------------------- | ----------------------------------- |
| Repository evidence         | Code, docs, CI on GitHub                | Production config or live behaviour |
| Preview evidence            | Vercel preview deploy of a PR tip       | Production edge or DNS              |
| Public-edge evidence        | curl against `mapable.com.au`           | That `main` tip is what is deployed |
| Production-account evidence | Neon/Vercel/GitHub owner settings       | Disposable migrate-from-zero        |
| Human acceptance evidence   | Manual a11y / tabletop / pilot journeys | Automated axe smoke alone           |

## Programme safety confirmation

- No merge/close/retarget of foreign PRs by this agent.
- No production Neon/Vercel/DNS/payment mutation.
- No `prisma db push` against shared/production databases.
- No new product domain in the truth/controls PR.
- Capability flags remain fail-closed; NDIA submit and automated payment approval remain hard-off.
