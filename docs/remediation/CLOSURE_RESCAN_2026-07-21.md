# Production-finish closure — Phase 0 rescan

**Date:** 2026-07-21  
**Reference main:** `3f406c3715d55e644d3385ccbd2141fa7b5813a2`  
**Resolved `origin/main`:** `3f406c3715d55e644d3385ccbd2141fa7b5813a2` — **matches reference**  
**Foundation:** PR #387 merged

## PR snapshot

| PR                  | Head (short) | Draft | Mergeable | CI / notes                                                                                      |
| ------------------- | ------------ | ----- | --------- | ----------------------------------------------------------------------------------------------- |
| #388 runtime/CSP    | `43485de0`   | yes   | MERGEABLE | All required checks SUCCESS                                                                     |
| #389 a11y panel     | `a8c1985d`   | yes   | MERGEABLE | **CI FAILED** — Prettier on `OWNER_ACTION_REQUIRED_OPS.md`; Accessibility SUCCESS; Vercel READY |
| #382 AT Continuity  | `55b648f9`   | yes   | MERGEABLE | CI/Accessibility re-running after main merge; prior tips green; Vercel READY at 6144 heap       |
| #367 Geoscape       | `c772317d`   | yes   | MERGEABLE | Green; base still pre-#387 tip `6279ab91`; **BLOCKED** licensing/privacy                        |
| #384 Access Address | `c82fc09e`   | yes   | MERGEABLE | Base = #367 head; depth-2 of train                                                              |

## Assumptions vs evidence

| Assumption                              | Evidence                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Main tip is #387                        | `VERIFIED`                                                                  |
| #388 has preview CSP gate + report sink | `VERIFIED` (code present)                                                   |
| Production CSP enforce hard-off         | `VERIFIED` (unit tests + gate)                                              |
| Flag-on Vercel preview                  | `NOT_RUN` (owner must set Preview env)                                      |
| #389 flag defaults false                | `VERIFIED` (code); AccessiBe remains when off                               |
| #382 flag defaults false                | `VERIFIED`                                                                  |
| Production HTTPS env after #387         | `FAILED` / `OWNER_ACTION_REQUIRED` — production build reject non-https URLs |

## Stack policy

Geoscape remains `#367 → #384 → (#385 → #386)`; depth 4 on full train. **No fifth PR.** Merge #367 only after licensing/privacy.
