# Synthetic mode

All public entry points require both
`MAPABLE_CORE_INTELLIGENCE_MAINFRAME_ENABLED=true` and
`MAPABLE_CORE_INTELLIGENCE_SYNTHETIC_ONLY=true`, plus a `SYNTHETIC` context
classification. The context requires `syn_` references and a synthetic facts
hash.

Any non-synthetic context, missing flag, production adapter, or execution
capability is a service denial. Phase A does not support shadow mode.
