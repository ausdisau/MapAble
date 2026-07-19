# Mission Portfolio (read-only projection)

`lib/mission-portfolio/` is a shared dependency projection and registry. It does **not** replace Care, Transport, Billing, Consent, or Starting Work writers.

- Registry: `mission.starting_work` → canonical projection `lib/pilot/starting-work`
- Service Standard: participant-visible promises with measurable signals
- What Changed: deterministic diff of dependency states

Mission Copilot must consume this projection with `READ_ONLY_EXPLAIN` authority only.
