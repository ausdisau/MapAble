# AccessCast Architecture

## Role

AccessCast is a **thin projection** over canonical MapAble systems. It produces forecasts, advisories, uncertainty, confirmation tasks, fallback comparisons, and presentation-ready summaries.

It does **not** write places, floor plans, incidents, trips, shifts, equipment, venue status, or participant passport fields.

## Composition chain

```
AccessPlace / Living Access Twin (AI Next graph)
  → AccessOps operational state (when merged)
  → Access Intelligence temporal + personal-fit reasoning
  → Transport and service dependencies
  → ContinuityOS fallback analysis (read only)
  → AccessCast projection
  → Companion / Life Planner / Visit Pack presentation
```

## Deterministic pipeline

1. Journey or destination selected  
2. Requirement set loaded (`fixture:taylor-harbour-v1` until AccessPassport on main)  
3. Forecast time + horizon resolved  
4. Canonical journey / place graph built  
5. Baseline accessibility evaluated  
6. Current and scheduled conditions applied  
7. Evidence freshness checked (AI Next TTL table)  
8. Service dependencies checked  
9. Reliability and fallback evaluated  
10. Burden attributed to organisations/workflows — never a person score  
11. Forecast state calculated by rules engine  
12. Evidence envelope created  
13. Participant-facing AccessCast rendered  
14. Optional confirmation actions offered  

A language model may **explain** output. It must **not** calculate the authoritative state (`MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED` permanently false).

## Forecast states

`stable` · `likely_usable` · `fragile` · `degraded` · `temporarily_unavailable` · `cannot_confirm` · `conflicting` · `stale` · `unknown`

Whole-journey state is the worst segment by severity. Never colour-only.

## Horizons

| Horizon | Range |
| --- | --- |
| nowcast | now–30m |
| near_term | 30m–4h |
| day_outlook | 4–24h |
| planning_outlook | 1–14d |
| long_range | >14d — baseline + refresh tasks only |

## Persistence

Wave 1–3: **computed only** (no Prisma). Offline packs are client-side snapshots with explicit expiry.

## Canonical Harbour refs

- Place: `accessplace:synthetic:harbour_civic`
- Room: `harbour_civic.room_3_12`
- Lift: `harbour_civic.lift_a`
- Entrance: `harbour_civic.entrance_west`
- Requirement set: `fixture:taylor-harbour-v1`
- Starting Work journey: `journey:synthetic:starting-work-harbour-v1`
