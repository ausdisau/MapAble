# CSP preview — performance evidence

**Status:** synthetic matrix tooling present; live Vercel Preview flag-on `NOT_RUN`  
**Related:** #388; `scripts/preview/csp-performance-matrix.mjs`

## Method

1. Run two local servers (or sequential builds): flag off vs `MAPABLE_CSP_ENFORCE_PREVIEW=true`.
2. `FLAG_OFF_BASE=… FLAG_ON_BASE=… pnpm preview:csp-perf-matrix`
3. Record JSON output as an artefact. Do not invent numbers.

## Advisory budgets (synthetic only)

| Metric          | Budget     |
| --------------- | ---------- |
| TTFB            | ≤ 3000 ms  |
| Load completion | ≤ 12000 ms |

These are regression guards for CI/local. They are **not** real-user Web Vitals.

## Matrix fields

| Surface                | Flag          | Status                              | TTFB | Load | Bytes | Cache | Enforce header | Notes     |
| ---------------------- | ------------- | ----------------------------------- | ---- | ---- | ----- | ----- | -------------- | --------- |
| `/`                    | off           | `NOT_RUN`                           |      |      |       |       |                |           |
| `/`                    | on (local/CI) | `NOT_RUN` until matrix run recorded |      |      |       |       |                |           |
| `/login`               | on            | `NOT_RUN`                           |      |      |       |       |                |           |
| `/provider-finder`     | on            | `NOT_RUN`                           |      |      |       |       |                |           |
| `/accessibility-map`   | on            | `NOT_RUN`                           |      |      |       |       |                |           |
| Vercel Preview flag-on | on            | `NOT_RUN`                           |      |      |       |       |                | Owner env |

## Gate

Performance evidence is not a merge blocker for #388 code, but is `OWNER_ACTION_REQUIRED` before claiming CSP enforce is pilot-ready.
