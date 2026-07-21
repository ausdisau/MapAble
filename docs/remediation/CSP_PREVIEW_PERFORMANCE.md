# CSP preview — performance evidence

**Status:** `NOT_RUN` for live preview metrics  
**Related:** #388 runtime hardening; smoke checklist `scripts/preview/csp-enforce-preview-smoke.md`

## Why this exists

Enforcing CSP (and removing AccessiBe under first-party panel cut-over) can change
third-party script scheduling. Capture Web Vitals / Lighthouse on the **same**
preview tip with flag on vs off before any production CSP discussion.

## Matrix (fill only with real runs)

| Surface              | Flag                 | LCP | INP | CLS | Lighthouse perf | Notes | Status    |
| -------------------- | -------------------- | --- | --- | --- | --------------- | ----- | --------- |
| `/`                  | off (report-only)    |     |     |     |                 |       | `NOT_RUN` |
| `/`                  | on (enforce preview) |     |     |     |                 |       | `NOT_RUN` |
| `/login`             | on                   |     |     |     |                 |       | `NOT_RUN` |
| `/provider-finder`   | on                   |     |     |     |                 |       | `NOT_RUN` |
| `/accessibility-map` | on                   |     |     |     |                 |       | `NOT_RUN` |

## Method

1. Use the Vercel preview URL for this PR tip.
2. Capture Chrome DevTools Performance or Lighthouse mobile + desktop.
3. Attach artefact links (do not paste PII).
4. Do not invent numbers.

## Gate

Performance evidence is **not** a merge blocker for #388 docs/code, but is
`OWNER_ACTION_REQUIRED` before claiming CSP enforce is pilot-ready.
