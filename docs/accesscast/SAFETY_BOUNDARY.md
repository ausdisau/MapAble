# AccessCast Safety Boundary

## Permanent deny flags (always false in code)

| Flag | Meaning |
| --- | --- |
| `MAPABLE_ACCESSCAST_SAFETY_GUARANTEE_ENABLED` | Never claim route/journey safety |
| `MAPABLE_ACCESSCAST_AUTO_ROUTE_CHANGE_ENABLED` | Never auto-change routes |
| `MAPABLE_ACCESSCAST_AUTO_BOOKING_ENABLED` | Never auto-book services |
| `MAPABLE_ACCESSCAST_BACKGROUND_LOCATION_ENABLED` | No continuous location |
| `MAPABLE_ACCESSCAST_DIAGNOSIS_INFERENCE_ENABLED` | No diagnostic inference |
| `MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED` | AI must not set forecast state |
| `MAPABLE_ACCESSCAST_PAID_CONFIDENCE_ENABLED` | Venues cannot buy better states |

## Evidence rules

- Unknown hard requirements → `cannot_confirm`
- Failed hard requirements cannot return `stable` / `likely_usable`
- Stale critical evidence → `stale` (or `cannot_confirm`)
- `model_candidate` cannot independently create `temporarily_unavailable`
- Venue declaration ≠ independent verification
- Offline expired data cannot produce `stable`
- confirmation_requested ≠ confirmation_received ≠ evidence_verified ≠ journey_guaranteed

## Kill criteria

Stop or roll back if AccessCast writes canonical SoRs, leaks participant requirements via partner APIs, presents expired offline packs as current, invents a universal score, or enables permanent deny flags in production.

## Production claims

This package is **synthetic / documentation**. `productionClaim: "none"` on all results.
