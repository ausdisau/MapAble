# Rollback

1. Set `MAPABLE_CAREOS_ENABLED=false` and deploy; CareOS routes return a
   disabled state and standard MapAble forms remain available.
2. If necessary, also set `MAPABLE_AI_ENABLED=false` and
   `MAPABLE_CAREOS_MEMORY_ENABLED=false`.
3. Preserve audit records and review affected request/trace IDs before
   re-enabling.
4. Do not drop CareOS data during incident rollback. Database rollback needs a
   reviewed forward migration because production PostgreSQL schema history has
   known drift.
