# Performance scenarios

Documented load scenarios for CareOS national platform. Scripts are lightweight stubs — full load testing runs in dedicated infrastructure.

## Scenarios

| ID | Name | Target | Threshold |
| -- | ---- | ------ | --------- |
| `api_read_baseline` | API read baseline | GET `/api/v1/organisations` | p95 < 500ms @ 50 rps |
| `health_check_burst` | Health check burst | Admin health dashboard | p95 < 200ms @ 20 rps |
| `federation_lookup` | Federation trust list | Federation service | p95 < 300ms @ 10 rps |
| `analytics_export` | Analytics export queue | Export approval flow | Queue depth < 100 |

## Running (stub)

```bash
pnpm test tests/performance/
```

Full k6/Artillery runs are out of scope for CI stubs. See `tests/performance/scenarios.test.ts` for documented thresholds.

## Cost correlation

Performance and cost trade-offs documented in `lib/platform/cost/`. Review hints before scaling production instances.
