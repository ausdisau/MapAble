# Prompt 0 — Branch reconciliation (current main)

**Inspection timestamp (UTC):** 2026-07-19T01:34:00Z  
**Original PR:** #279 (`cursor/shared-programme-foundation-7fa5` @ `ba6f77fd`)  
**Original merge-base:** `fdd22bb3`  
**Current `main`:** `6db2e961`  
**Reconciliation branch:** `cursor/shared-programme-foundation-reconcile-6ea8`  
**Strategy:** Fresh branch from `main` (no force-push of #279). Do not start Prompt 11.

## Reconciliation table (pre-edit)

| Area                                          | Original Prompt 0 assumption      | Current-main fact                                                    | Action                                                                                |
| --------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CareOSMission`                               | Target via PR #252                | **Absent**; #252 closed unmerged                                     | Keep interim `CaseMissionAdapter`; interface-replaceable; no speculative mission DDL  |
| `AccessPassport`                              | Target via PR #273                | **Absent**; #273 closed unmerged                                     | Passport adapter over `AccessibilityProfile` + Communication Passport projection      |
| `AccessPlace` / `AccessiblePlace`             | Prefer AccessPlace                | Both present; AccessPlace canonical                                  | New programme writes → AccessPlace only; tests forbid AccessiblePlace creates         |
| `ProgrammeSourceRecord`                       | New on Prompt 0                   | Absent                                                               | **Keep** as programme evidence spine                                                  |
| `RegulatorySourceVersion` (#278)              | Optional FK                       | #278 open, not mergeable; model absent                               | No copy of #278 model; string/opaque adapter hook + Platform Assurance future adapter |
| `ParticipantAuthorityGrant`                   | New                               | Absent                                                               | **Keep**                                                                              |
| Navigator family (11 models)                  | New                               | Absent                                                               | **Keep** (Rights Navigator foundation)                                                |
| Trust ledger (3 models)                       | New                               | Absent                                                               | **Keep**                                                                              |
| `ConsentRecord` / `AuditEvent`                | Extend via services               | Present                                                              | Extend via `lib/programmes/audit.ts` + consent linkage; no parallel ledgers           |
| AURA                                          | L3_PROPOSE on open PRs / fixtures | No `lib/aura/`; companion `stopAura`; AI-platform authority ceilings | Revalidate against AI-platform + companion stop; proposal-only boundary tests         |
| Migration `20260716120000_shared_programme_*` | Additive                          | **Collides** with indoor `20260716120000` on main                    | Replace with `20260719120000_shared_programme_foundation` (not deployed)              |
| Programme flags                               | 12 `MAPABLE_*_ENABLED`            | Absent on main                                                       | Retain server-side, default false                                                     |
| Mission portfolio / Starting Work             | Not in Prompt 0                   | Present on main (projections)                                        | Do not duplicate; Case adapter remains mission interim                                |

## Model classification (20 Prisma artefacts)

| Model / enum family                                | Classification           | Rationale                                         |
| -------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| `ProgrammeSourceRecord`                            | **Keep**                 | Programme evidence spine; not Platform Assurance  |
| `ProgrammeSourceImpactReview`                      | **Keep**                 | Impact workflow for programme sources             |
| `ParticipantAuthorityGrant`                        | **Keep**                 | Scoped delegation beyond ConsentRecord fields     |
| `NavigatorOrganisation` … `NavigatorFeedback` (11) | **Keep**                 | Rights Navigator foundation; no existing SoT      |
| `ServiceRelationshipRecord`                        | **Keep**                 | Trust role disclosure spine                       |
| `ServiceRoleDisclosure`                            | **Keep**                 | Field-level disclosure on relationship            |
| `TrustRelationshipSnapshot`                        | **Keep**                 | Versioned trust view                              |
| `RegulatorySourceVersion`                          | **Defer** (adapter only) | Owned by Platform Assurance (#278 unmerged)       |
| Speculative `CareOSMission*`                       | **Remove as dependency** | Absent; adapter interface only                    |
| Second passport table                              | **Remove**               | Use AccessibilityProfile / Communication Passport |

## Migration decision

Migration **has not been deployed** on main (model absent; timestamp unused for programmes).  
**Replace** colliding `20260716120000_shared_programme_foundation` with:

`prisma/migrations/20260719120000_shared_programme_foundation/migration.sql`

## Prompt 11 readiness gate (evaluated after reconciliation)

| Gate | Status |
| --- | --- |
| Mergeable Prompt 0 reconciliation branch | **Pending human review / CI** — branch created; do not mark ready automatically |
| Green required CI | **Pending** — push triggers CI |
| Reviewed schema | **Pending human review** |
| Resolved source-registry ownership | **Documented** (programme spine vs deferred Platform Assurance) |
| Current AURA/AI-platform boundary tests | **Pass locally** (`tests/programmes/current-main-compatibility.test.ts`) |
| No duplicate mission/passport/place/consent/audit SoT | **Pass** (adapters only) |

### Local verification (2026-07-19)

| Check | Result |
| --- | --- |
| `prisma validate` / `db:generate` | Pass |
| `pnpm type-check` | Pass |
| `vitest run tests/programmes` | Pass (35) |
| Migration order / integrity | Pass (57 migrations) |
| Domain ownership / feature deps / merge-train | Pass |
| ESLint on changed programme TS | Pass (batched; full `pnpm lint` OOM historically) |
| `next build --no-lint` | Pass |
| Full `pnpm build` (includes lint) | **Fail OOM** — also fails on current `main` under same heap |
| Disposable DB migrate deploy | **Blocked** — no reachable Postgres/docker in environment |

**Prompt 11 must not begin** until mergeable + green CI + human schema review complete.
