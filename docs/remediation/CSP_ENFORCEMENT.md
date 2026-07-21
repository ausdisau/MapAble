# CSP enforcement status

**Status:** report-only in production; preview/CI enforce available behind fail-closed flag  
**Last refreshed:** 2026-07-21 (closure programme)

## Current production behaviour

- Header: `Content-Security-Policy-Report-Only` only via `next.config.ts` / `getBaselineSecurityHeaders()`.
- `script-src` includes `'unsafe-inline'` and `'unsafe-eval'` on the report-only policy.
- **Enforcing `Content-Security-Policy` must not be enabled in production.**

## Preview / CI enforcement (this programme)

| Control             | Value                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Flag                | `MAPABLE_CSP_ENFORCE_PREVIEW=true`                                                                                        |
| Enable environments | Vercel `preview` **or** local/CI `development`/`test`                                                                     |
| Hard-off            | `VERCEL_ENV=production` (even if flag set)                                                                                |
| Policy builder      | `buildContentSecurityPolicyEnforce(nonce)` — nonce required, **no** `unsafe-eval`                                         |
| Request headers     | Middleware sets `Content-Security-Policy` + `x-nonce` on the **forwarded request** so Next.js can nonce framework scripts |
| Response headers    | Same enforce policy on the response when flag on                                                                          |
| Layout nonce        | `headers()` + JSON-LD `nonce=` **only when flag on** (avoids forcing dynamic rendering when off)                          |
| Report sink         | `POST /api/security/csp-report` — content-type allowlist, 8KB→413, rate limit, redaction, `Cache-Control: no-store`       |
| CI matrix           | `.github/workflows/csp-enforce-preview.yml` + `pnpm test:csp-enforce`                                                     |
| Perf matrix         | `scripts/preview/csp-performance-matrix.mjs` (synthetic; not RUM)                                                         |

## AccessiBe

`acsbapp.com` is **not** on the enforce allowlist. Flag-on enforce is expected to block AccessiBe.
Production CSP enforce remains **BLOCKED** until PR **#389** first-party panel is approved and AccessiBe is removed.

## Evidence statuses

| Item                           | Status                                                   |
| ------------------------------ | -------------------------------------------------------- |
| Unit gate + policy shape tests | `VERIFIED` (CI)                                          |
| CI Playwright flag-on matrix   | run via CSP enforce workflow — record pass/fail per tip  |
| Vercel Preview flag-on         | `NOT_RUN` until owner sets Preview env and records smoke |
| Production enforce             | hard-off / `NOT_APPLICABLE` for this programme           |

## Rollback

1. Unset `MAPABLE_CSP_ENFORCE_PREVIEW` (or set `false`) on Preview.
2. Redeploy Preview.
3. Confirm only Report-Only header remains.
4. Production never had enforce enabled — no production rollback required for this flag.
