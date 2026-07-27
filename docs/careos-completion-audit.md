# CareOS Platform Completion Audit (Wave 0)

**Date:** 2026-07-14  
**Tip inspected:** `agent/careos-national-platform` @ `ae945e25`  
**Completion branch:** `agent/careos-platform-completion`  
**Auditor role:** integration lead / safety engineer  

This audit precedes broad implementation. Findings drive Tasks A–Q.

---

## 1. Canonical architecture recommendation

| Concern | Source of truth | Demote / retire |
|--------|-----------------|-----------------|
| **Missions** | Single Prisma `CareOSMission` in `prisma/schema.prisma` → table `careos_missions`, accessed only via Prisma client | Dual fabric schema in `docs/merge-pending/…/careos.prisma`; `$executeRaw` writers in `intelligence/operations/` and `intelligence/kernel/v1/appointment-persistence.ts` |
| **Mission events** | Append-only `CareOSMissionEvent` as children of the tip mission | Treat as separate platform bus |
| **Action receipts / human reviews / preferences** | Tip Prisma models (to be unified in Task A) | Orphan migration without tip model (`careos_action_receipts`) |
| **Platform integration events** | `CloudEventOutbox` + `lib/platform/event-outbox-service.ts` | Do not merge with mission event spine |
| **Workflows** | `WorkflowRun` + `lib/platform/durable-workflow-service.ts` | Temporal remains optional behind `TEMPORAL_ENABLED` |
| **Authority** | `ParticipantAuthorityGrant` + `AuthorityDecision` + consent records | Org membership never implies participant authority |
| **Domain execution** | Existing domain services (`lib/care`, `lib/transport`, marketplace, AbilityPay, …) invoked only after confirmation-bound action tokens | Intelligence may draft/recommend only |

**Consolidation path:** extend tip `CareOSMission` with fabric fields (`desiredOutcome`/`goal`, `graphJson`, `stateVersion`, `correlationId`, `tenantId`, `authorityDecisionId`, modules/alerts/proposals as JSON), add child models for events/reviews/receipts/preferences, rewrite fabric persistence to Prisma, remove quarantine, keep one table.

---

## 2. Merge and branch map

| Branch | vs tip | Disposition |
|--------|--------|-------------|
| `agent/mapable-intelligence-fabric` | Contained (code merged; schema quarantine remains) | **needs schema reconciliation (Task A)** |
| `agent/careos-cloud-platform` … `agent/careos-support-coordination` | Feature commits contained; tip has reverse PR merge-commit only | **already contained** |
| `agent/careos-transport-command` → `agent/careos-national-platform` | Contained linearly | **already contained** |
| Parallel: Academy, Access marker, public Access map | Separate product surfaces | **integrate only via adapters (Tasks J/K)** — do not merge advertising/UI noise |

Stack tip for completion PR base: `agent/careos-national-platform`.

Open draft PRs in the phase chain (#242–#251) remain historical; completion PR supersedes for productionisation.

---

## 3. Schema conflict inventory

| Conflict | Severity | Evidence |
|----------|----------|----------|
| Dual `CareOSMission` / `careos_missions` shapes | **Critical** | Tip: `missionType` + `inputSummary`. Fabric quarantine: `goal`, `modules[]`, `graphJson`, … |
| Dual CREATE migrations | **Critical** | `20260713220727_careos_foundation` vs quarantined `20260713112000_careos_operational_state` |
| Runtime skew | **Critical** | Tip writers use Prisma; fabric uses `$executeRaw` fabric columns |
| `careos_action_receipts` without tip model | **High** | Migration kept; model only in quarantine |
| `careos_participant_preferences` vs life-twin preference memories | **High** | Dual preference stores |
| Mission events / human reviews only in quarantine | **High** | Used by fabric ops services |

Details: `docs/merge-pending/mapable-intelligence-fabric/README.md`.

### Intelligence code trees (do not leave as parallel SoRs)

| Path | Role |
|------|------|
| `packages/intelligence-kernel/` | Shared capability/authz primitives |
| `intelligence/` | Fabric network + kernel v1 appointment (raw SQL persistence) |
| `lib/intelligence/careos/` | Tip CareOS orchestrator (Prisma tip missions) |
| `lib/intelligence/mainframe/` | Synthetic mainframe (flags isolate) |

---

## 4. Unfinished workflow inventory

| Workflow | Gap | Paths |
|----------|-----|-------|
| Provider response lifecycle | Accept/decline exist; incomplete capacity → proposal → offer → confirm chain + expiry | `lib/bookings/provider-response.ts`, `lib/care/shift-offer-service.ts` |
| Worker cancellation recovery | Continuity options exist in transport; provider workforce recovery not end-to-end confirmed offers | `lib/transport/continuity/`, provider workforce services |
| Shift-note drafting | Assistant flag exists; source-cited draft + worker review gate incomplete as product flow | docs/flags vs `lib/care` |
| Marketplace post-discovery | Stops at shortlist/compare; missing purpose-limited disclosure grant UX, structured proposals, agreement versioning wire-up, booking orchestration, secure messaging, complaints | `lib/marketplace/participant-marketplace-service.ts` |
| AbilityPay | Participant reconcile/decision exists; no full invoice ingestion, provider/plan-manager portals, versioned corrections | `lib/abilitypay/`, `app/participant/abilitypay/` |
| Home & Living | Profile + clinical boundaries; missing property proposals, plan distribution, safeguarding human queue productisation | `lib/home-living/` |
| Notification cloud | In-app create; email prefs not delivered through unified cloud; push stub | `lib/notifications/`, `lib/platform/push/stub-provider.ts` |
| Event outbox relay | Library only; no worker | `lib/platform/event-outbox-service.ts` |
| Durable workflows | Claim/retry helpers; no continuous runner | `lib/platform/durable-workflow-service.ts` |
| Fabric mission persistence | Flagged off in CI; incompatible with tip table when enabled | `intelligence/config.ts` |

---

## 5. Production adapter inventory

| Capability | Dev/fake | Production | Gap |
|------------|----------|------------|-----|
| Object storage | Config `recording` (no full impl) | Config allows `s3`/`supabase` — **no class** | Implement adapters |
| Queue | `RecordingQueueProvider` | `managed` — **missing** | Implement |
| Cache | `MemoryCacheProvider` | `redis` — **missing** | Implement |
| Push | `StubPushProvider` | Missing | Implement |
| Email | Channel prefs | `lib/sendGrid.ts` unwired to notification cloud | Wire |
| SMS | — | Twilio Verify (auth only) | Notification SMS adapter |
| Observability | National health checks when flagged | OpenTelemetry/full lag metrics partial | Extend |
| Infra | OpenTofu modules under `infra/` | Not bound to app adapters | Task Q |

`getCloudConfig()` rejects recording/memory in production — correct fail-closed, but production classes must exist first.

---

## 6. Security gap inventory

- Critical IDOR suite exists (`tests/security/critical-idor.test.ts`) but CareOS mission/action routes need expanded coverage.
- Authority threat tests exist; webhook delivery authZ/IDOR incomplete for partner/v1 routes.
- Fabric `MAPABLE_AI_ENABLED` default **true** in `intelligence/config.ts` vs tip CareOS fail-closed defaults — **align fail-closed**.
- Release `security-gate` is a stub; Semgrep is separate.
- Admin unrestricted participant access not fully denied by design tests.
- Action-token / outbox replay / signed-URL suites incomplete for production.

---

## 7. Accessibility gap inventory

- `tests/accessibility/**` are largely **source-inspection**, not axe/Playwright.
- No `@axe-core` usage found.
- CareOS release accessibility gate stub-passes.
- Portals (plan-manager, clinician, developer, admin CareOS surfaces) uneven coverage.

---

## 8. Migration risk assessment

| Risk | Severity |
|------|----------|
| Reintroducing quarantined CREATE for `careos_missions` | Critical |
| Enabling fabric persistence against tip schema | Critical |
| Action receipts / preferences tables vs missing tip models | High |
| CI `prisma db push` in careos-validation masking migrate order | Medium |
| Coordination `linkedMissionId` FK assumes tip IDs | Medium |

**Required:** disposable clean-DB migrate deploy test (not `db push`) after Task A.

---

## 9. CI / infra / admin ops

| Area | Finding |
|------|---------|
| Workflows | `quality.yml`, `careos-validation.yml` (path-filtered, db push, lockfile auto-commit), `careos-release.yml` (stubs), `semgrep.yml` |
| Need | One canonical CareOS validation: frozen lockfile, migrate deploy, type-check, security, a11y, build, staging smoke |
| Admin | `/admin/system-health` exists; missing outbox lag, queue depth, relay, notifications failure dashboards as first-class surfaces |
| Infra | Modules present; adapters unbound |

---

## 10. Task ownership plan

| Task | Owner | Owns paths | Depends on |
|------|-------|------------|------------|
| **A Mission SoR** | Integration lead | `prisma/**`, fabric persistence rewrite | — |
| **B Branch consolidation doc** | Integration lead | `docs/careos-branch-consolidation.md` | Audit |
| **C Provider/workforce** | Parallel | `lib/care`, provider APIs, review queues | A (mission link) |
| **D Marketplace** | Parallel | `lib/marketplace`, agreements, messaging | A, authority |
| **E AbilityPay** | Parallel | finance portals + adapters | Authority/step-up |
| **F Home & Living** | Parallel | property/support governance | Authority, quality |
| **G Cloud adapters** | Parallel | `lib/platform/*` adapters | Config ownership |
| **H Events/workflows** | Parallel | outbox relay, durable runner | G |
| **I Notifications** | Parallel | notification cloud | G |
| **J Academy** | Parallel | academy→competency adapter | Workforce |
| **K Access evidence** | Parallel | access→CareOS evidence | Transport/Access |
| **L Journeys** | Integration | `tests/careos/journeys/**` | A–K |
| **M Safety docs** | Parallel | `docs/careos-*.md` | — |
| **N Security** | Parallel | tests + fixes | A |
| **O Accessibility** | Parallel | real a11y CI | — |
| **P Ops admin** | Parallel | admin dashboards | H, I |
| **Q Infra/CI** | Integration lead | workflows, infra root | G |

Shared files (prisma, package.json, CI, middleware, env schemas, global nav) — **integration lead only**.

---

## 11. Definition gates used for “complete”

Per programme brief §23–§24: CareOS is **not** complete or production-ready until mission SoR is singular, quarantine cleared, migrations clean, critical journeys green with AI on/off, security and accessibility gates real, staging smoke observed, and production claims only after human approval + backups/restore evidence.

---

## 12. Immediate next actions

1. Task A — canonical mission schema + Prisma rewrite of fabric persistence.  
2. Task B — write `docs/careos-branch-consolidation.md`.  
3. Parallel C–I for unfinished ops + cloud runtime.  
4. Canonical CI + clean-DB migrate test.  
5. Journey + security + a11y suites.  
6. Draft PR → `agent/careos-national-platform`.
