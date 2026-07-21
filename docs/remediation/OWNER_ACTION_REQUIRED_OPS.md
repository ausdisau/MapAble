# Account-owner operations checklist (closure programme)

**Rule:** Do not mark items `VERIFIED` unless the named owner performed them and recorded evidence. Agents leave unfinished work as `OWNER_ACTION_REQUIRED` or `NOT_RUN`.  
**Main tip at last refresh:** `3f406c3715d55e644d3385ccbd2141fa7b5813a2` (PR #387)

## D1 — HTTPS / canonical production env

| Item                                                               | Status                  | Evidence / next step                                                                                     |
| ------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Set Vercel Production `NEXTAUTH_URL=https://mapable.com.au`        | `OWNER_ACTION_REQUIRED` | Vercel Project → Settings → Environment Variables → Production                                           |
| Set Vercel Production `NEXT_PUBLIC_APP_URL=https://mapable.com.au` | `OWNER_ACTION_REQUIRED` | Must match `NEXTAUTH_URL`                                                                                |
| Redeploy Production after change                                   | `OWNER_ACTION_REQUIRED` | Record deployment ID + commit SHA + build result                                                         |
| Public edge probe (no secrets)                                     | run locally             | `node scripts/ci/verify-public-https-gate-readonly.mjs`                                                  |
| Post-deploy smoke                                                  | `OWNER_ACTION_REQUIRED` | `/api/auth/session`, `/api/auth/providers`, `/api/health/live`, `/api/health/ready`, canonical redirects |

**Note:** Post-#387 production build previously **FAILED** when non-https URLs were present (`dpl_GgwzvxTy6LHDjcC2A8oRu6rKZEr4`). Do not claim fixed until owner redeploy evidence exists.

## D2 — Branch protection

| Item                                                                                                           | Status                  | Evidence                                                  |
| -------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| Require PR; ≥1 independent approval; dismiss stale                                                             | `OWNER_ACTION_REQUIRED` | GitHub Settings → Rules/Branches                          |
| Required checks: CI, Migrations, Migrate from zero, Security, Accessibility, Production claims, Vercel Preview | `OWNER_ACTION_REQUIRED` | Exact job names in `docs/operations/branch-protection.md` |
| Prevent silent admin bypass; record break-glass                                                                | `OWNER_ACTION_REQUIRED` |                                                           |
| Read-only audit helper                                                                                         | available               | `node scripts/ci/audit-branch-protection-readonly.mjs`    |

## D3 — Distributed rate limiting

| Item                                    | Status                                            |
| --------------------------------------- | ------------------------------------------------- |
| Approved distributed store in repo      | **None** — see `docs/operations/RATE_LIMITING.md` |
| Vendor selection by agent               | Forbidden during freeze                           |
| Sensitive features while in-memory only | Remain blocked / fail-closed                      |

## D4 — Monitoring and on-call

| Item                                      | Status                  | Doc                                     |
| ----------------------------------------- | ----------------------- | --------------------------------------- |
| Configure probes + alerts with thresholds | `OWNER_ACTION_REQUIRED` | `docs/operations/SERVICE_OPERATIONS.md` |
| Name on-call primary + escalation         | `OWNER_ACTION_REQUIRED` |                                         |
| CSP violation / security event routing    | `OWNER_ACTION_REQUIRED` |                                         |

## D5 — Recovery and exercises

| Item                                        | Status    | Doc                                                                |
| ------------------------------------------- | --------- | ------------------------------------------------------------------ |
| Neon snapshot / PITR evidence               | `NOT_RUN` | `docs/operations/BACKUP_RESTORE.md`                                |
| Staging restore + schema verify + smoke     | `NOT_RUN` | `docs/operations/STAGING_MIGRATION_REHEARSAL.md` (#382) / tabletop |
| Incident / privacy / safeguarding tabletops | `NOT_RUN` | `docs/operations/TABLETOP_EXERCISES.md`                            |

## D6 — Human accessibility + golden journeys

| Item                    | Status    | Doc                                                          |
| ----------------------- | --------- | ------------------------------------------------------------ |
| Ordered release session | `NOT_RUN` | `docs/operations/CONTROLLED_PILOT_RELEASE_SESSION.md`        |
| Manual AT matrix        | `NOT_RUN` | `docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md` |
| Golden journeys G1–G10  | `NOT_RUN` | `docs/operations/CONTROLLED_PILOT_GOLDEN_JOURNEYS.md`        |

## Workstream E — Geoscape / stale PRs

| Item                                    | Status                              |
| --------------------------------------- | ----------------------------------- |
| #367 licensing/privacy                  | `OWNER_ACTION_REQUIRED` / `BLOCKED` |
| #384 retarget after #367                | `NOT_RUN`                           |
| Fifth Geoscape PR                       | `NOT_APPLICABLE` (forbidden)        |
| #379 PBS under non-canonical path       | `BLOCKED`                           |
| #383 VisionAccess without freeze waiver | `BLOCKED` (remain draft)            |

Exact sequence: `docs/remediation/GEOSCAPE_TRAIN_RETARGET.md`.

## Preview flags (must stay off in production)

| Flag                                         | Production    | Preview owner action                                                  |
| -------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| `MAPABLE_CSP_ENFORCE_PREVIEW`                | hard-off      | Optional Preview `true` for smoke — evidence `NOT_RUN` until recorded |
| `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL` | default false | Optional Preview `true` after #389 review                             |
| `MAPABLE_AT_CONTINUITY_ENABLED`              | default false | Keep false unless isolated synthetic test                             |
