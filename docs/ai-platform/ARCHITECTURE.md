# Architecture

Canonical layer: `lib/ai/platform/` with adapters over existing modules. Prefer gradual consolidation over mass moves.

```
Domain services → capability registry → (optional) model gateway → AI SDK providers
                              ↓
                     kill switches / budgets / telemetry
                              ↓
                     human-review + evidence envelopes
                              ↓
                     deterministic MapAble services execute
```

Governing rule: AI assists cognition; participants decide; authorised humans approve; deterministic services execute; evidence records outcomes.
