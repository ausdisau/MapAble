# Pilot runbook

1. Keep `MAPABLE_AI_PLATFORM_ENABLED=false` until registry call sites are wired.
2. Enable one capability flag at a time in a controlled tenant.
3. Confirm kill switches and deterministic fallbacks.
4. Do not flip `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` without ConvergenceOS claim evidence.

## MapAble Navigator governed pilot

All Navigator flags default **false**. Do not enable in production without completing
[`NAVIGATOR_ASSURANCE.md`](./NAVIGATOR_ASSURANCE.md) §9 checklist with named owners.

| Flag | Purpose |
|------|---------|
| `MAPABLE_NAVIGATOR_PILOT_ENABLED` | Master pilot surface |
| `MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED` | Model interpret/reply |
| `MAPABLE_NAVIGATOR_PILOT_ENVELOPES` | Draft-only envelopes |
| `MAPABLE_NAVIGATOR_PILOT_PASSPORT` | Decision Passport |
| `MAPABLE_NAVIGATOR_PILOT_MEMORY` | Approved-category memory |
| `MAPABLE_NAVIGATOR_PILOT_MATCHING` | Deterministic match/rank |

**Safe fallback:** classic Provider Finder (`/provider-finder`) via opt-out — no penalty.

**Kill path:** `MAPABLE_AI_GLOBAL_KILL_SWITCH=true` and/or capability kill keys under `navigator.provider_search.*`.

**Rollback:** see [`ROLLBACK.md`](./ROLLBACK.md) and assurance §8 — preserve audit/consent/drafts.
