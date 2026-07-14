# CareOS Phase 9 — MapAble Moves Rehabilitation Cloud

Phase 9 adds non-prescriptive rehabilitation coordination: participant goals, clinician-authored versioned plans, activities, equipment notes, telehealth session records, and optional source-labelled device data.

## Clinical boundaries (hard)

CareOS **must NOT**:

- Diagnose
- Prescribe
- Alter treatment autonomously
- Increase exercise intensity automatically
- Interpret symptoms as medical conclusions
- Issue emergency advice outside configured pathways

Only **verified clinical authors** (`ClinicalAuthor`) may create or approve treatment instructions.

**Activity completion is NOT proof of clinical improvement.**

Device data is optional, source-labelled, and revocable.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_MOVES_REHABILITATION_ENABLED` | `false` | Master switch for Moves rehabilitation |
| `MAPABLE_MOVES_TELEHEALTH_ENABLED` | `false` | Telehealth session records (uses mock video adapter in dev) |
| `MAPABLE_MOVES_DEVICE_IMPORT_ENABLED` | `false` | Optional health device imports |
| `diagnoseEnabled` | **hardcoded `false`** | Platform cannot diagnose |
| `prescribeEnabled` | **hardcoded `false`** | Platform cannot prescribe |
| `alterTreatmentEnabled` | **hardcoded `false`** | Platform cannot alter treatment |
| `intensityAutoIncreaseEnabled` | **hardcoded `false`** | No automatic intensity increases |

## Schema (migration `20260714100000_moves_rehabilitation`)

Models:

- `RehabilitationPlan` — participant + clinician author, status lifecycle
- `RehabilitationPlanVersion` — versioned instructions JSON, approval timestamp
- `RehabilitationGoal` — participant goals linked to plan
- `ClinicalAuthor` — verified professional registration gate
- `PlanAcknowledgement` — participant acknowledgement of plan version
- `PlanReview` — clinician review queue
- `RehabilitationActivity` — scheduled activities with accessible instructions
- `TelehealthSessionRecord` — session metadata (separate from core telehealth rooms)
- `HealthDeviceImport` — source-labelled payload with revoke support

## Module layout

```
lib/moves/
  clinical-boundaries.ts   — forbidden action classification
  plans-service.ts         — createPlan, addVersion, acknowledge, requestReview
  activities-service.ts    — schedule, complete, miss follow-up
  telehealth-service.ts    — telehealth records + device import/revoke
lib/config/moves-rehabilitation.ts
app/participant/moves/     — goals, today's activities, feedback, pause
app/clinician/moves/       — plan editor queue, review queue
components/moves/          — accessible panels
```

## Key APIs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET/POST/PATCH | `/api/participant/moves/plans` | List plans, acknowledge, pause |
| GET/PATCH | `/api/participant/moves/activities` | Today's activities, complete with feedback |
| GET/POST | `/api/clinician/moves/plans` | Plan editor, versions, reviews, schedule activities |

## Telehealth

Moves telehealth uses `TelehealthSessionRecord` for rehabilitation-specific session metadata. Join URLs are provisioned via the existing mock video adapter (`lib/telehealth/video/mock-video-adapter.ts`) — the Moves domain remains separate from appointment-linked `TelehealthVideoRoom` records.

## Device imports

Each import requires a `sourceLabel` (e.g. device name). Participants may revoke imports via `revokeHealthDeviceImport`, setting `revokedAt`.

## Validation

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/mapable
export DIRECT_URL=postgresql://user:password@localhost:5432/mapable
npx prisma validate
npx prisma generate
pnpm vitest run tests/moves tests/accessibility/moves
```
