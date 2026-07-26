# `lib/` structure

Snapshot after Phase A + Phase B consolidation (2026-07-26).

## Scale

- ~975 TypeScript modules
- Hyphenated top-level feature folders nested under domain umbrellas (Phase B)
- Only remaining top-level hyphenated directory by design: `personal-data-vault/` (hard security boundary)
- Keep **auth**, **security**, **prisma**, consent/vault, and Stripe webhook handlers as hard boundaries

## Canonical homes (Phase A)

| Concern | Path |
|--------|------|
| Geo / map helpers | `lib/map/` (`geo`, `location-coords`, `leaflet-icons`, …) |
| Routing / slugs | `lib/routing/routes.ts` |
| Email (SendGrid) | `lib/notifications/sendgrid.ts` |
| Provider claim tokens | `lib/provider/claim-verify.ts` |
| NZ / AU jurisdiction | `lib/config/nz-schemes.ts` |
| Provider outlets JSON | `lib/provider/finder/` |
| React Query provider | `lib/hooks/query-provider.tsx` |
| Org API scoping | `lib/api/organisation-scope.ts` (shim: `phase3-scope.ts`) |
| Legacy Stripe checkout helpers | `lib/stripe/legacy-checkout-service.ts` (shim: `billing/stripe-billing/`) |
| DB client | `lib/prisma.ts` (do not scatter) |

## Domain umbrellas (Phase B)

Hyphenated top-level directories were nested under the umbrellas below. Leaf names drop a redundant shared prefix when unambiguous (`access-map` → `access/map`).

| Umbrella | Examples (new paths) |
|----------|----------------------|
| `access/` | `map`, `search`, `fit`, `reviews`, `import`, `indoor`, `floor-plan`, `venue`, `intelligence-next`, `accessibility-map` |
| `transport/` | `routing`, `route-optimisation`, `care-map`, `dispatch-console`, `operator-dispatch`, `investment-modelling`, `network-rollout` |
| `billing/` | `core`, `payment-reconciliation`, `settlement-batches`, `partner`, `stripe-billing` |
| `provider/` | `finder`, `ops`, `quality`, `verification`, `academy`, `benchmarking`, `enterprise`, `onboarding-automation` |
| `partner/` | `portal`, `sandbox`, `marketplace`, `api-program` |
| `ai/` | `platform`, `matching`, `governance`, `monitoring-dashboard`, `agent-ops`, `agent-sessions`, `case-copilot`, `mission-copilot` |
| `ndis/` | `pricing`, `ndia-pilot`, `ndia-readiness`, `ndia-provider-claiming` |
| `reporting/` | `board`, `government`, `grant`, `sla`, `data-trust-annual` |
| `governance/` | `community`, `charter`, `data`, `oversight-board`, `constitutional-safeguards`, … |
| `compliance/` | `evidence`, `renewals`, `algorithm-register`, `civic-audit-index` |
| `security/` | `readiness`, `external-audit` (+ existing security modules) |
| `trust/` | `fabric`, `passport`, `safety` |
| `support/` | `coordinator`, `profile`, `communication-passport`, `plan-manager`, `plan-manager-pilot` |
| `platform/` | `year-one`, `convergence-os`, `core-ui`, `status`, `launch-readiness`, `at-continuity`, … |
| `api/` | `developer`, `versioning`, `certification`, `certified-ecosystem`, `open-data` |
| `public/` | `informational`, `transparency`, `government-portal` |
| `research/` | `federated`, `safe-room`, `national-insights`, `social-impact`, … |
| `assessor/` | `network`, `tools` |
| `employment/` | `ats`, `providers` |
| `evidence/` | `automation` |
| `bookings/` | `graph` |
| `integrations/` | `auspost-pac` |
| `community/` | `mapable-peers` |
| `contracts/` | `service-agreements` |
| `workforce/` | `readiness` |
| `privacy/` | `preserving-analytics` |

## Compatibility shims (temporary)

- `lib/api/phase3-scope.ts` → `organisation-scope`
- `lib/auth/resolve-nextauth-secret.ts` → `nextauth-env`
- `lib/billing/stripe-billing/checkout-service.ts` → `stripe/legacy-checkout-service`

Remove shims once callers and docs no longer reference the old paths.

## Do not flatten

- `auth/`, `security/` (core), `crypto/`, `consent/`, `personal-data-vault/`
- Payment webhook entrypoints (`stripe/webhooks.ts`, `billing/core/webhook-handler.ts`)
- Large engines stay intact as nested units: `ai/platform/`, `access/intelligence-next/`, `access/indoor/`, `platform/convergence-os/`, `search/`, `programmes/`

## Conventions going forward

- No new top-level hyphenated directories — place new modules under an existing domain umbrella
- Prefer kebab-case filenames (`with-authorization.ts`, not `withAuthorization.ts`)
- Prefer one clear checkout/invoicing entry under `billing/` + `stripe/` rather than parallel `*-billing` packages
- Import style: `@/lib/<umbrella>/<leaf>/...` (e.g. `@/lib/access/map/copy`)
