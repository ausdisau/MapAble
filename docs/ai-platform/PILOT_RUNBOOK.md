# Pilot runbook

1. Keep `MAPABLE_AI_PLATFORM_ENABLED=false` until registry call sites are wired.
2. Enable one capability flag at a time in a controlled tenant.
3. Confirm kill switches and deterministic fallbacks.
4. Do not flip `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` without ConvergenceOS claim evidence.
