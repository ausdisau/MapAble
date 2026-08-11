# Rollback

1. Set `MAPABLE_AI_GLOBAL_KILL_SWITCH=true` or disable capability flags.
2. Engage capability kill switch in process if needed.
3. Reverse unused additive migrations only after confirming no production dependency.
4. Public claims remain false — no marketing rollback required.

## Navigator governed pilot

1. Unset / set false: `MAPABLE_NAVIGATOR_PILOT_ENABLED`, `_MODEL_ASSISTED`, `_ENVELOPES`, `_PASSPORT`, `_MEMORY`, `_MATCHING`.
2. Engage kill keys `navigator.provider_search.*` if needed.
3. Do not delete consent, audit, passport, or envelope rows during rollback — preserve evidence.
4. Additive migrations `20260811094500_navigator_governed_pilot_phase1` and `20260811200000_navigator_governed_pilot_phase2` may remain; reverse only on non-prod if required.
5. Participants retain classic Provider Finder without AI.
