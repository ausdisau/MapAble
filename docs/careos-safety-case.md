# CareOS safety case

**Version:** 2026-07-14  
**Scope:** CareOS intelligence layer on MapAble  
**Related:** `docs/intelligence/SAFETY_CASE.md`, `docs/careos/AUTONOMY_MODEL.md`

## Claim

CareOS provides decision support (L0–L2) over existing MapAble domain services. It does **not** autonomously execute consequential actions in production.

## Safety objectives

| ID | Objective | Evidence |
|----|-----------|----------|
| SO-1 | No silent operational change | Production autonomy ceiling L2; confirmation tokens for consequential paths |
| SO-2 | Fail-closed defaults | `MAPABLE_CAREOS_ENABLED=false`, `MAPABLE_AI_ENABLED=false` unless explicitly enabled |
| SO-3 | Human ownership of high-risk domains | Clinical, safeguarding, capacity, funding, emergency remain human-only |
| SO-4 | Auditable decisions | Structured `AuditEvent` with redacted metadata |
| SO-5 | Recoverable disable | Module flags immediately stop new CareOS requests |

## Hazard analysis (summary)

| Hazard | Control |
|--------|---------|
| Unauthorised booking/payment | No production executor; domain services require confirmed action tokens |
| Clinical overreach | Prohibited capabilities list; `requires_qualified_clinical_review` routing |
| Silent worker substitution | Worker cancellation recovery requires participant confirmation; no auto-assign |
| Data leakage in notifications | Preview redaction; no clinical content in email previews |
| Schema dual-write | Task A single mission SoR; quarantined migration blocked |

## Verification

- Policy unit tests: `tests/careos/foundation.test.ts`, `tests/careos-action-kernel.test.ts`
- Journey scaffolds: `tests/careos/journeys/**` (AI-off + confirmation paths)
- Security: `tests/security/critical-idor.test.ts` (expanded in Task N)

## Residual risk

Fabric raw-SQL persistence remains until Task A validation completes. Do not enable `MAPABLE_AI_ENABLED` in production until mission SoR is singular and migrate deploy is green on clean DB.

## Sign-off gate

Production readiness requires human approval, backup/restore evidence, and staging smoke per programme brief §23–§24.
