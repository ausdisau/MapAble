# Proof-carrying door-to-room journey preflight (Wave 5 / PR 3)

## Scope

- Origin → stop/curb → external path → entrance → lift → corridor → room → return stub
- Dependency graph with single points of failure and unverified fallbacks
- Participant burden attributed to workflows/organisations — never a person score
- Proof-carrying result envelope alongside structured segments
- Accessible step list UI (no compulsory map)

## Scenario A acceptance

Taylor needs Room 3.12 with step-free, ≥850 mm, lift operational, accessible toilet, written directions; avoid staff-only entrance.

System returns **`cannot_confirm`** (not `compatible`) because lift status and corridor width are unresolved, while excluding the staff entrance and preserving evidence limitations.

## Non-goals

- No external bookings or Continuity execution
- No Prisma persistence
- No claim that a route found equals journey completed
