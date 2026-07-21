# Production-finish closure — Phase 0 / terminal rescan

**Date:** 2026-07-21  
**Reference main:** `3f406c3715d55e644d3385ccbd2141fa7b5813a2`  
**Resolved `origin/main`:** `3f406c3715d55e644d3385ccbd2141fa7b5813a2` — **matches reference**  
**Foundation:** PR #387 merged

## PR snapshot (closure tip)

| PR                  | Head                     | Draft | Mergeable | Notes                                                           |
| ------------------- | ------------------------ | ----- | --------- | --------------------------------------------------------------- |
| #388 runtime/CSP    | see tip after this push  | yes   | MERGEABLE | Nonce request/response; CI CSP workflow; owner packs (D)        |
| #389 a11y panel     | `8300dc0d` (pre-closure) | yes   | MERGEABLE | Flag default false; AccessiBe mutex; dual Preview `NOT_RUN`     |
| #382 AT Continuity  | `51fc2a9d`               | yes   | MERGEABLE | Acceptance fail-closed; migration compare; human form `NOT_RUN` |
| #367 Geoscape       | `c772317d`               | yes   | MERGEABLE | Base pre-#387; **BLOCKED** licensing/privacy                    |
| #384 Access Address | `c82fc09e`               | yes   | MERGEABLE | Base = #367 head; no auto-retarget                              |

## Assumptions vs evidence

| Assumption                           | Evidence                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| Main tip is #387                     | `VERIFIED`                                               |
| #388 CSP nonce on request + response | `VERIFIED` (code + unit)                                 |
| Production CSP enforce hard-off      | `VERIFIED`                                               |
| Flag-on Vercel Preview               | `NOT_RUN`                                                |
| CI flag-on Playwright                | record per tip from `CSP enforce preview` workflow       |
| #389 flag defaults false             | `VERIFIED`                                               |
| Combined #388+#389 dual Preview      | `NOT_RUN`                                                |
| #382 flag defaults false             | `VERIFIED`                                               |
| #382 human preview                   | `NOT_RUN`                                                |
| Production HTTPS env                 | `OWNER_ACTION_REQUIRED` (prior build `FAILED` non-https) |
| Distributed rate limit               | `BLOCKED` — no approved store                            |
| Geoscape depth ≤3                    | `FAILED` (depth 4) until human sequence                  |

## Stack policy

Geoscape: `#367 → #384 → #385 → #386`. **No fifth PR.** Merge #367 only after licensing/privacy. See `GEOSCAPE_TRAIN_RETARGET.md`.
