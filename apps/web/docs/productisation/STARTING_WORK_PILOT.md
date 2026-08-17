# Starting Work controlled pilot — Taylor @ Harbour Civic Centre

**Mode:** controlled_pilot (synthetic fixtures by default)  
**Flag:** `MAPABLE_STARTING_WORK_PILOT_ENABLED` (default false)  
**Synthetic only:** `MAPABLE_STARTING_WORK_SYNTHETIC_ONLY` (default true)  
**DB projection:** `MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED` (default false)

## Scope

- 1 provider · 5–10 participants · small worker cohort
- 1 transport operator · 1 employer/civic venue (Harbour Civic Centre)
- 1 equipment/repair partner · 1 regional coordinator
- Human review throughout
- Database-backed **temporary** `StartingWorkJourneyProjection` (not CareOSMission SoR; not a Care/Transport/Billing writer)

## Operating chain

Communication Passport → worker readiness → Academy evidence ≠ competency → accessible transport → door-to-room preflight → workplace arrival → support delivery → outcome receipt → invoice → Provider Ops attention → Continuity recovery → Regional candidates (≠ confirmed) → participant approval → accountability path

## Dependency + state honesty

Projection stores a dependency graph (care, readiness, quote, trip, entrance, indoor, equipment, billing, return) and keeps states separate: requested / quoted / accepted / confirmed / delivered / reviewed / invoiced / outcome achieved / disputed / recovery required.

## APIs

- `GET /api/pilot/starting-work` — loop status + prohibitions (+ `?journeyId=` when persistence on)
- `POST /api/pilot/starting-work` — authenticated golden journey (optional failureMode); persists when DB flag on
- `GET /api/pilot/starting-work/simulate` — synthetic-only Playwright/browser path
- Page: `/pilot/starting-work`

## Browser journey

`pnpm test:e2e:starting-work` (Playwright `tests/e2e/starting-work-golden.spec.ts`) with pilot flags enabled.

## Kill criteria

Stop if unsupervised, AI gains operational authority, mock marketed as live, smartphone-only essential access, or tenant isolation unproven.

## Rollback

Disable flags; no live NDIA or physical actuation was enabled. Projection rows remain for audit when persistence was used.

## Honesty / claims

- `productionClaimStatus: not_claimable`
- Not a live booking engine; projection is not CareOSMission SoR
- Closed draft **#317** failed CI on an obsolete stack; content consolidated via #327/#330 — see [PR_315_317_REPAIR.md](./PR_315_317_REPAIR.md)
