# MapAble Access Weather (AccessCast)

Public name: **Access Weather**  
Internal service: **AccessCast**  
Tagline: **Know before you go.**

AccessCast is a **read-oriented intelligence projection** that forecasts how usable a place, route, service, or complete journey is likely to be at the participant’s intended time.

## Wave 0 reconciliation (verified on `main`)

| Dependency | Status | AccessCast reuse |
| --- | --- | --- |
| Access Intelligence Next (#303/#304/#306) | Merged — synthetic Harbour graph + preflight | Compose graph IDs, evidence classes, temporal TTLs |
| AccessOps (#309) | Open tip | Later operational-state bridge |
| Native Companion (#315) | Open tip | Offline Visit Pack presentation |
| Starting Work (#317) | Open tip | Journey scenario IDs |
| Inclusive Life Planner (#318) | Open tip | Opportunity outlook |
| ContinuityOS | Tip / not on main | Fallback read only — never execute |

**PR 1 ships against `main` alone** — no dependency on open tips.

## What this is not

- Not a new AccessPlace database or second Living Access Twin
- Not a universal accessibility score or safety guarantee
- Not a navigation authority, emergency alerter, or surveillance system
- Not a weather service or replacement for professional assessment / O&M support

## Package layout

- `lib/accesscast/` — contracts, deterministic rules, synthetic Harbour + Starting Work forecasts, offline pack projection
- `app/accesscast/demo` — accessible Access Outlook card
- `app/api/accesscast/demo` — synthetic demo API (404 when flags off)
- `tests/accesscast/` — unit + accessibility tests (no DB)

## Feature flags

All product flags default **off**. Permanent deny flags cannot be enabled by client params.

See [SAFETY_BOUNDARY.md](./SAFETY_BOUNDARY.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick test

```bash
pnpm exec vitest run tests/accesscast/
```
