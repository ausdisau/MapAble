# CSP enforce preview smoke (flag-on)

**Flag:** `MAPABLE_CSP_ENFORCE_PREVIEW=true`  
**Hard-off:** `VERCEL_ENV=production`  
**Status of live evidence:** flag-**off** baseline recorded below; flag-**on** enforce remains `NOT_RUN` until preview env is set.

### Recorded preview session (2026-07-21, agent)

| Field                                    | Value                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Preview URL                              | `https://mapableau-7jfkuree8-mapableau.vercel.app` (tip `6f48b226`; deployment protection via Vercel share cookie) |
| Flag on preview                          | **unset / false** (report-only only)                                                                               |
| Enforce `Content-Security-Policy`        | absent (`VERIFIED` fail-closed default)                                                                            |
| Report-Only header                       | present; includes `unsafe-eval`; `report-uri /api/security/csp-report`                                             |
| Correlation                              | `x-correlation-id` / `x-request-id` present on `/`                                                                 |
| Report `POST` valid                      | **204** empty body                                                                                                 |
| Report wrong content-type                | **415**                                                                                                            |
| Flag-on nonce / no-`unsafe-eval` enforce | `NOT_RUN` — owner must set `MAPABLE_CSP_ENFORCE_PREVIEW=true` on preview only                                      |

## Local / CI synthetic flag-on (not Vercel Preview)

1. `MAPABLE_CSP_ENFORCE_PREVIEW=true pnpm build` (or `pnpm build:csp-enforce`)
2. Start with the same flag (`pnpm start` or Playwright `PLAYWRIGHT_WEB_SERVER`)
3. `pnpm test:csp-enforce`

Do **not** reuse a `.next` tree built with the flag off: runtime enforce then
emits a nonce that prerendered `/_next` scripts do not carry, and Playwright
reports `body` hidden / empty title. The suite asserts matching script nonces
so that mismatch fails with an explicit rebuild message.

## Header / nonce checks

| Check                                                       | Expected                        | Result                  | Evidence |
| ----------------------------------------------------------- | ------------------------------- | ----------------------- | -------- |
| HTML response has `Content-Security-Policy` (enforce)       | Present when flag on in preview | `NOT_RUN`               |          |
| Policy includes `nonce-` and omits `unsafe-eval`            | Verified in header              | `NOT_RUN`               |          |
| `x-nonce` request header reaches layout / JSON-LD `nonce=`  | Present on inline scripts       | `NOT_RUN`               |          |
| Production deploy never emits enforce header with this flag | Hard-off                        | `VERIFIED` (unit tests) |          |

## Route smoke (flag on)

| Route                        | Page loads | Console CSP errors (redacted origins only) | Result                       |
| ---------------------------- | ---------- | ------------------------------------------ | ---------------------------- |
| `/`                          |            |                                            | `NOT_RUN`                    |
| `/login`                     |            |                                            | `NOT_RUN`                    |
| `/provider-finder`           |            |                                            | `NOT_RUN`                    |
| `/accessibility-map`         |            |                                            | `NOT_RUN`                    |
| Care request entry           |            |                                            | `NOT_RUN`                    |
| Transport request entry      |            |                                            | `NOT_RUN`                    |
| Payment UI (only if enabled) |            |                                            | `NOT_APPLICABLE` / `NOT_RUN` |

## Report endpoint

| Check                                                        | Result                             |
| ------------------------------------------------------------ | ---------------------------------- |
| `POST /api/security/csp-report` returns 204 for valid report | `VERIFIED` (unit) / live `NOT_RUN` |
| Oversized / wrong content-type rejected                      | `VERIFIED` (unit)                  |
| Logs never contain script samples or query secrets           | `VERIFIED` (unit)                  |

## Accessibility widget interaction

AccessiBe loads third-party script hosts that may violate enforce-mode CSP.
Cut-over decision: see focused extract PR **#389** /
`docs/remediation/ACCESSIBILITY_WIDGET_DECISION.md` (after #389 merges, or keep
AccessiBe off in CSP-enforce preview sessions).

| Decision                                                                   | Status                  |
| -------------------------------------------------------------------------- | ----------------------- |
| Keep AccessiBe in production until first-party panel approved              | `OWNER_ACTION_REQUIRED` |
| CSP enforce preview tested with AccessiBe disabled or first-party panel on | `NOT_RUN`               |

## Sign-off

| Field       | Value                   |
| ----------- | ----------------------- |
| Preview URL |                         |
| Tester      |                         |
| Date        |                         |
| Overall     | PASS / FAIL / `NOT_RUN` |
