# CSP enforcement status

**Status:** release blocker for broad service; report-only acceptable for public informational / early controlled pilot with monitoring.

## Current production behaviour (verified 2026-07-20)

- Header: `Content-Security-Policy-Report-Only` only (no enforcing `Content-Security-Policy`).
- `script-src` includes `'unsafe-inline'` and `'unsafe-eval'`.
- Applied via `lib/security/headers.ts` → `next.config.ts` `headers()`.

## Enforcement path (implemented but not wired)

`buildContentSecurityPolicyEnforce(nonce)` builds a policy that:

- uses `'nonce-…'` for scripts;
- omits `'unsafe-eval'`;
- keeps inventoried Stripe / maps / analytics hosts.

It is **not** applied in `getBaselineSecurityHeaders()` because Next.js inline bootstrap, auth widgets, Stripe.js, map tiles/scripts, and AdSense have not been proven to survive enforce mode in CI smoke tests.

## Safe enablement checklist (account-owner + engineering)

1. Inject a per-request nonce into the root layout and every required inline script.
2. Run Playwright smoke on `/`, `/login`, `/provider-finder`, `/accessibility-map`, care/transport request, and Stripe-related pages with enforce headers in a preview.
3. Confirm no CSP violations that break auth, payments UI, or maps.
4. Flip `getBaselineSecurityHeaders()` to emit `Content-Security-Policy` (enforce) and keep Report-Only as a secondary signal if desired.
5. Remove `'unsafe-eval'` from the report-only policy only after enforce is green.

Until then, treat enforced CSP without `unsafe-eval` as a **release blocker**, not a Wave 0 merge gate.
