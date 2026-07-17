# Starting Work controlled pilot — Taylor @ Harbour Civic Centre

**Mode:** controlled_pilot (synthetic fixtures by default)  
**Flag:** `MAPABLE_STARTING_WORK_PILOT_ENABLED` (default false)  
**Synthetic only:** `MAPABLE_STARTING_WORK_SYNTHETIC_ONLY` (default true)

## Scope

- 1 provider · 5–10 participants · small worker cohort
- 1 transport operator · 1 employer/civic venue (Harbour Civic Centre)
- 1 equipment/repair partner · 1 regional coordinator
- Human review throughout

## Operating chain

Communication Passport → worker readiness → Academy evidence ≠ competency → accessible transport → door-to-room preflight → workplace arrival → support delivery → outcome receipt → invoice → Provider Ops attention → Continuity recovery → Regional candidates (≠ confirmed) → participant approval → accountability path

## APIs

- `GET /api/pilot/starting-work` — loop status + prohibitions
- `POST /api/pilot/starting-work` — run golden journey (optional failureMode)

## Kill criteria

Stop if unsupervised, AI gains operational authority, mock marketed as live, smartphone-only essential access, or tenant isolation unproven.

## Rollback

Disable flags; no live NDIA or physical actuation was enabled.
