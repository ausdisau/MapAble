# CSP enforcement status

**Status:** report-only in production; preview enforce available behind fail-closed flag  
**Last refreshed:** 2026-07-20

## Current production behaviour

- Header: `Content-Security-Policy-Report-Only` only via `next.config.ts` / `getBaselineSecurityHeaders()`.
- `script-src` includes `'unsafe-inline'` and `'unsafe-eval'` on the report-only policy.
- **Enforcing `Content-Security-Policy` must not be enabled in production.**

## Preview-only enforcement (this programme)

| Control              | Value                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Flag                 | `MAPABLE_CSP_ENFORCE_PREVIEW=true`                                                                              |
| Enable environments  | Vercel `preview` **or** local `development`/`test`                                                              |
| Hard-off             | `VERCEL_ENV=production` (even if flag set)                                                                      |
| Policy builder       | `buildContentSecurityPolicyEnforce(nonce)` — nonce required, **no** `unsafe-eval`                               |
| Nonce propagation    | Middleware sets `x-nonce`; root layout applies nonce to JSON-LD scripts                                         |
| Report sink          | `POST /api/security/csp-report` — content-type allowlist, 8KB cap, process-local rate limit, redacted logs only |
| Smoke runbook        | [csp-enforce-preview-smoke.md](../../scripts/preview/csp-enforce-preview-smoke.md)                              |
| Performance evidence | [CSP_PREVIEW_PERFORMANCE.md](./CSP_PREVIEW_PERFORMANCE.md) — `NOT_RUN` until measured                           |
| Widget decision      | [ACCESSIBILITY_WIDGET_DECISION.md](./ACCESSIBILITY_WIDGET_DECISION.md) + extract PR #389                        |

## Smoke routes (preview evidence required)

When the flag is on in preview, capture pass/fail (and redacted blocked-uri origins) for:

- `/`
- `/login`
- `/provider-finder`
- `/accessibility-map`
- Care request entry
- Transport request entry
- Payment UI **only if** already enabled in that preview

Live flag-on preview evidence status: **`NOT_RUN`** until recorded in the smoke runbook.
Header/nonce unit tests are not a substitute for a real preview session.

## Safe production enablement (future — not authorised here)

1. Preview enforce green across smoke routes
2. Confirm auth, Stripe, maps, AdSense survive without `unsafe-eval`
3. Account-owner approval
4. Only then consider production enforce (separate change)

Until then, enforced CSP without `unsafe-eval` remains a **release blocker** for broad service, not a merge gate for this remediation PR.
