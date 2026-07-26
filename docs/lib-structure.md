# `lib/` structure

Snapshot after Phase A consolidation (2026-07-26).

## Scale

- ~975 TypeScript modules
- ~219 top-level directories (many single-file feature stubs)
- Keep **auth**, **security**, **prisma**, consent/vault, and Stripe webhook handlers as hard boundaries

## Canonical homes (Phase A)

| Concern | Path |
|--------|------|
| Geo / map helpers | `lib/map/` (`geo`, `location-coords`, `leaflet-icons`, …) |
| Routing / slugs | `lib/routing/routes.ts` |
| Email (SendGrid) | `lib/notifications/sendgrid.ts` |
| Provider claim tokens | `lib/provider/claim-verify.ts` |
| NZ / AU jurisdiction | `lib/config/nz-schemes.ts` |
| Provider outlets JSON | `lib/provider-finder/` |
| React Query provider | `lib/hooks/query-provider.tsx` |
| Org API scoping | `lib/api/organisation-scope.ts` (shim: `phase3-scope.ts`) |
| Legacy Stripe checkout helpers | `lib/stripe/legacy-checkout-service.ts` (shim: `stripe-billing/`) |
| DB client | `lib/prisma.ts` (do not scatter) |

## Compatibility shims (temporary)

- `lib/api/phase3-scope.ts` → `organisation-scope`
- `lib/auth/resolve-nextauth-secret.ts` → `nextauth-env`
- `lib/stripe-billing/checkout-service.ts` → `stripe/legacy-checkout-service`

Remove shims once callers and docs no longer reference the old paths.

## Recommended next consolidations (Phase B)

Nest thin satellites under domain umbrellas (mechanical moves + import updates):

1. **access/** — `access-map`, `access-search`, `access-fit`, `access-reviews`, `access-moderation`, `access-import`, `access-accreditation`, `accessibility-map`, `accessibility-accreditation`
2. **transport/** — `transport-routing`, `tracking`, `route-optimisation`, `operator-dispatch`, `dispatch-console`, `tfnsw`, `care-transport-map`
3. **billing/** — fold `billing-core`, `invoices`, `payment-reconciliation`, `settlement-batches`, `partner-billing`; retire `stripe-billing` shim
4. **provider/** — nest 1-file `provider-*` satellites; keep `provider-finder` as sibling or `provider/finder`
5. **partner/** — nest `partner-{portal,sandbox,marketplace,billing,api-program}`
6. **reporting/** / **governance/** — nest 1-file reporting and governance stubs
7. **config/** — rename `phase*.ts` / `y*-*.ts` to domain flag files with temporary re-exports

## Do not flatten

- `auth/`, `security/`, `crypto/`, `consent/`, `personal-data-vault/`
- Payment webhook entrypoints (`stripe/webhooks.ts`, `billing-core/webhook-handler.ts`)
- Large engines: `ai-platform/`, `access-intelligence-next/`, `indoor-accessibility/`, `convergence-os/`, `search/`, `programmes/`

## Conventions going forward

- No new top-level 1-file directories — place new modules under an existing domain folder
- Prefer kebab-case filenames (`with-authorization.ts`, not `withAuthorization.ts`)
- Prefer one clear checkout/invoicing entry under `billing/` + `stripe/` rather than parallel `*-billing` packages
