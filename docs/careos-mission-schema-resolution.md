# CareOS mission schema resolution (Task A)

## Decision

**One table / one Prisma model:** `careos_missions` / `CareOSMission` in `prisma/schema.prisma`.

Extended tip model now includes:

- `desiredOutcome` (fabric `goal`)
- `graphJson`, `modulesJson`, `alertsJson`, `proposalsJson`
- `tenantId`, `authorityDecisionId`, `stateVersion`, `correlationId`, `workflowRunId`
- Child models: `CareOSMissionEvent`, `CareOSHumanReview`, `CareOSActionReceipt`, `CareOSParticipantPreference`

## Migration

`prisma/migrations/20260714170000_canonical_careos_mission`

- **Additive** `ALTER TABLE` on tip `careos_missions` (no second CREATE)
- `CREATE IF NOT EXISTS` for child tables
- Quarantined fabric `20260713112000_careos_operational_state` must **never** be reapplied

## Persistence rewrite

| Before | After |
|--------|-------|
| `intelligence/operations/mission-state-service.ts` `$executeRaw` | Prisma via `lib/careos/canonical-mission-service.ts` |
| `intelligence/kernel/v1/appointment-persistence.ts` raw SQL | Prisma upsert + transaction |
| `intelligence/preferences/preference-service.ts` raw SQL | Prisma upsert |
| `intelligence/actions/action-receipt-service.ts` raw SQL | Prisma create/update |

Compatibility: `toFabricMissionView()` exposes `{ goal, modules }` for older fabric callers.

## Rollback

1. Disable `MAPABLE_CAREOS_PERSISTENCE_ENABLED`.
2. Do not delete additive columns (non-destructive).
3. Revert application commits that depend on new fields.
4. Child tables may remain empty unused.

## Backfill

- `correlationId` backfilled to `id` where empty
- `desiredOutcome` defaults to `''` for legacy tip rows; writers populate going forward

## Safety posture

`intelligence/config.ts` AI/network defaults are **fail-closed** (`MAPABLE_AI_ENABLED` default false).
