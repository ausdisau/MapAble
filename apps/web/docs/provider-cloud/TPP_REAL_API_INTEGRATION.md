# MapAble ProviderCloud — current TPP Wholesale REST integration

**Status:** Implemented, not independently verified against a live reseller account. Read-only, default disabled, non-production only. Requires Phase A PR #23; Phase B/C database and order workflow are not implemented. Production sales are **not approved**.

## Current state and evidence

The code provides genuine server-to-server HTTP for current TPP Wholesale REST endpoints, rather than the historical 2015 auth.pl/session-ID interface.

- Official TPP API reference: https://www.tppwholesale.com.au/api/
- Fixed API host: https://api.tppwholesale.com.au
- Authentication: POST /jwt/auth/token/ with JSON apiKey and secretKey, plain-text JWT response.
- Availability: GET /domains/{domain}/check-availability with JWT in Bearer header.
- TPP states that JWTs last one hour and are bound to their originating IP address.
- Vercel outbound egress / Static IP guidance: https://vercel.com/academy/optimize-your-vercel-account/backend-egress
- Existing Phase A synthetic Domain Manager: https://github.com/ausdisau/MapAble/pull/23

## Architecture and implemented components

| File | Capability |
|---|---|
| lib/provider-cloud/tpp-wholesale/client.ts | Real HTTPS auth and read-only domain query; strict fixed API host, token cache, one 401 reauthentication, timeout, validated response, sanitised errors |
| lib/provider-cloud/tpp-wholesale/config.ts | Default-off provider, read-only, fixed-egress and environment gates |
| app/api/providercloud/domains/availability/route.ts | Cookie session, provider_admin role, server-read organisation membership, same-origin request, acknowledgement; no-store response |
| app/provider/(console)/domains/tpp | Accessible developer-only form and availability results |
| tests/provider-cloud-tpp-client.test.ts | Transport and input contract tests |
| tests/provider-cloud-tpp-route.test.ts | Tenant, role, CSRF, consent and default-off contract tests |

No domain purchase, transfer, registration, renewal, DNS edit, Vercel binding, billing, migration or production change is implemented. Search results are **not** a final customer quotation. The public TPP example does not independently establish price currency, GST or final reseller pricing.

## Configuration

Do not put live credentials in source code, chat, browser code or examples. A reseller account owner must obtain server-only API credentials in TPP Console > Reseller > API. Configure in an approved isolated environment:

~~~dotenv
MAPABLE_PROVIDER_CLOUD_ENABLED=false
MAPABLE_TPP_WHOLESALE_READONLY_ENABLED=false
MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED=false
TPP_WHOLESALE_API_KEY=
TPP_WHOLESALE_SECRET_KEY=
~~~

All flags default to false. Before enabling **read-only preview testing**, verify and document that both the JWT exchange and authenticated availability requests originate from the same stable outbound IP, including after failover. Prefer a dedicated Australian fixed-egress worker or a dedicated Vercel Static IP project if commercial/region/access requirements are met. A flag is only an attestation, not proof of networking.

Permitted runtime: controlled local development or Vercel preview with the three explicit feature gates. **Production Vercel deployments remain hard-denied** even if flags are enabled. Note Vercel preview builds may have NODE_ENV=production, but VERCEL_ENV=preview.

## Procedure

1. Review TPP's authenticated current API contract and reseller terms. Verify quotas, error format, credential scopes and charges before real account testing.
2. Verify fixed egress. Independently confirm the same originating IP for the token exchange and lookup.
3. Use non-production credentials with no order permissions where TPP permits this. If TPP has no true sandbox, do not submit an order.
4. Start MapAble with its normal development scripts, using test organisation/user records.
5. Log in as a provider_admin with server-verified membership and visit /provider/domains/tpp.
6. Acknowledge that the domain candidate will be sent to TPP, and perform a read-only availability check.
7. Verify the vendor result and retain only approved, non-sensitive, redacted test evidence.
8. Disable the flags again at the end of the controlled test.

## Identity, privacy, consent, accessibility and failure recovery

- Never trust Host, x-mapable-tenant-id, form organisation IDs, or client feature flags as access authority.
- The external request sends only a domain name; no participant profiles, NDIS data, user sessions, health data or registrant records.
- Authentication tokens and raw vendor errors must never appear in a browser, logs, URL parameters or audit payloads.
- Enforce WCAG 2.2 AA, keyboard, switch/AAC, screen reader, 200-400% zoom, accessible status and errors, and human support fallback; not certified or user-tested by this PR.
- The public API is read-only. If network egress changes, a token expires, or TPP fails, report a generic error. Do not silently switch to unapproved outbound IPs or retry any registration transaction.
- Add durable distributed rate limiting, data retention decisions, operational monitoring and incident escalation before public release.
- Record domain registration/renewal/transfer in a **future** durable order ledger, with human approval, billing reconciliation and audit. Ownership remains with the lawful customer independently of hosting.
- Do not infer current NDIS registrations or compliance status from domain availability. Verify current official rules separately.

## Required tests and commands

From apps/web:

~~~sh
pnpm exec vitest run tests/provider-cloud-tpp-client.test.ts tests/provider-cloud-tpp-route.test.ts
pnpm type-check
pnpm lint:app-api
pnpm lint:app-rest
pnpm lint:lib
pnpm ci:domain-ownership
~~~

The isolated pure TPP client passed 25 deterministic Node 22 local checks. This is not proof of Vitest success, production readiness, accessible end-to-end behavior or live TPP authentication.

## Go / no-go decision

**Go for code review and optionally controlled read-only connectivity after fixed-egress and credentials are verified. No-go for production, automatic provisioning or domain sales.**

A future PR needs approved Phase B persistence, explicit domain ownership, the authenticated TPP order/quote schema, .au eligibility, real billing, idempotency across external calls, ambiguous order reconciliation, a tested customer transfer/exit plan, manual accessible approvals and independent security/accessibility review. No automatic merge, deployment or production flag activation.
