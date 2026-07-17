# Remediation Phase 0 — Current State

**Inspected at:** 2026-07-17  
**Base branch:** `main`  
**Base SHA:** `5c6679831d6c467d6edec4e64a98c60b98e8a761`  
**Finding status values:** `verified` | `likely` | `needs_runtime_verification` | `not_present` | `already_remediated`

This document records repository inspection before remediation edits. A file or model existing is **not** proof that a capability works in production.

## Repository identity

| Finding                                             | Status      | Evidence                                                     |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| Next.js App Router + React + TypeScript application | verified    | `package.json` (`next@15.5.7`, `react@^18`), `app/` tree     |
| Prisma + PostgreSQL data layer                      | verified    | `prisma/schema.prisma`, `DATABASE_URL` in `.env.example`     |
| Package manager pnpm with lockfile                  | verified    | `packageManager: pnpm@10.12.1`, `pnpm-lock.yaml`             |
| Clean working tree on inspection                    | verified    | `git status` empty at base SHA                               |
| Replacement app / second platform present           | not_present | Single Next.js app + `apps/realtime-server` workspace member |

## Tooling and quality gates

| Finding                                                        | Status             | Evidence                                               |
| -------------------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| Scripts: `type-check`, `lint`, `test`, `format:check`, `build` | verified           | `package.json` scripts                                 |
| ESLint ignored during `next build`                             | already_remediated | PR 1 removed `ignoreDuringBuilds`                      |
| Full-repo `eslint .` can OOM                                   | verified           | Mitigated by scoped `pnpm lint` + heap limit (PR 1)    |
| Full-repo Prettier red (~1477 files)                           | verified           | CI uses scoped `format:check`; `format:check:all` debt |
| `tests/` not in default lint gate                              | verified           | `pnpm lint:tests` follow-up                            |
| TypeScript build errors fail the build                         | verified           | `typescript.ignoreBuildErrors: false`                  |
| GitHub Actions CI for lint/test/build                          | not_present        | Only `.github/workflows/semgrep.yml` and Replit sync   |
| CODEOWNERS                                                     | not_present        | No root or `.github/CODEOWNERS` at inspection          |
| Playwright / axe browser accessibility suite                   | not_present        | No playwright config; no `@axe-core` dependency        |
| Husky prepush runs type-check, format, lint                    | verified           | `prepush` script                                       |

## Configuration and secrets

| Finding                                                            | Status      | Evidence                                                        |
| ------------------------------------------------------------------ | ----------- | --------------------------------------------------------------- |
| `.env.example` documents core secrets and feature gates            | verified    | Auth, Stripe, Xero, NDIS, mock providers                        |
| NDIS encryption falls back to `NEXTAUTH_SECRET` then static string | verified    | `lib/crypto/ndis.ts`                                            |
| Transport routing provider defaults to `mock`                      | verified    | `.env.example`, `lib/config/transport-routing.ts`               |
| Many phase12 flags default enabled (`!== "false"`)                 | verified    | `lib/config/phase12.ts`                                         |
| Typed production capability registry API                           | not_present | Transport local matrix only (`lib/transport/feature-status.ts`) |
| Production fail-closed validation for encryption key               | not_present | `lib/env.ts` does not require `NDIS_ENCRYPTION_KEY`             |

## Data model and migrations

| Finding                                                                 | Status   | Evidence                                                            |
| ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| Single large Prisma schema (~482 models)                                | verified | `prisma/schema.prisma`                                              |
| 48 migration directories                                                | verified | `prisma/migrations/**`                                              |
| Duplicate migration timestamp `20260525000000`                          | verified | `mapable_access_phase_1` and `ndis_direct_claiming`                 |
| Historical migrations contain `db push` developer comments              | verified | Multiple phase migration SQL headers                                |
| Parallel transport models (`TransportBooking` vs `TransportTrip`)       | verified | Schema + `lib/transport/booking-bridge-service.ts`                  |
| Parallel invoice models (`Invoice`, `BillingInvoice`, `NdisInvoice`, …) | verified | Schema sections + `lib/invoices`, `lib/billing`, `lib/billing-core` |
| Multiple consent-related models                                         | verified | `ConsentRecord`, `FhirConsentRecord`, `TelehealthRecordingConsent`  |

## Domains and routes

| Finding                                                            | Status   | Evidence                                                |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------- |
| Care / transport / jobs / billing libs exist with substantial code | verified | `lib/care`, `lib/transport`, `lib/jobs`, `lib/billing`  |
| Xero integration largely stub/placeholder                          | verified | `lib/xero/**`                                           |
| Care invoice placeholder path                                      | verified | `app/api/care/bookings/[id]/invoice-placeholder`        |
| National accountability one-step publish to `published`            | verified | `lib/national-accountability/accountability-service.ts` |
| Admin ambient permission grant                                     | verified | `lib/auth/permissions.ts` `isAdminRole` short-circuit   |
| `/admin` and `/employer` absent from middleware auth prefixes      | verified | `lib/mapable-peers/peer-middleware.ts`                  |
| ~479 API `route.ts` files; many without Zod                        | likely   | Static counts; not every route audited line-by-line     |
| Public accountability pages unauthenticated                        | verified | `app/(core)/accountability`                             |
| Mobile contracts are scaffolding, not a shipped native app         | verified | `mobile-contracts/**`                                   |

## Documentation honesty

| Finding                                                 | Status      | Evidence                                                  |
| ------------------------------------------------------- | ----------- | --------------------------------------------------------- |
| Accessibility statement avoids WCAG certification claim | verified    | `app/(marketing)/accessibility-statement/page.tsx`        |
| Phase docs prescribe `prisma db push` as deploy path    | verified    | `docs/mapable/core-phases.md`, module docs                |
| Ops docs warn against prod `db push` in places          | verified    | `docs/operations/production-infrastructure.md`            |
| Transport docs already prefer `TransportTrip` SoT       | verified    | `.cursor/rules/mapable-transport.mdc`, `docs/transport/*` |
| `docs/remediation/**` before this programme             | not_present | Created by PR 1                                           |

## Maturity (inspection only — not promotion)

| Capability                                       | Honest state                                            | Status   |
| ------------------------------------------------ | ------------------------------------------------------- | -------- |
| Auth sessions                                    | internal_alpha                                          | verified |
| Care full request→reconciliation loop            | controlled_pilot (gaps: agreements, evidence invoicing) | likely   |
| Transport full trip loop with production routing | pilot / sandbox                                         | verified |
| Billing Centre                                   | internal_alpha                                          | verified |
| Jobs employment-support loop                     | scaffold / internal_alpha                               | likely   |
| NDIA live claim submission                       | scaffold / mock                                         | verified |
| Public accountability governed pipeline          | demo                                                    | verified |
| Native mobile app                                | concept (contracts only)                                | verified |
| WCAG / ISO / SOC certification                   | not_present as claims                                   | verified |

## What this document does not prove

- That any capability is `production_ready` or `generally_available`
- That deploy-time configuration in Vercel matches `.env.example`
- That every API route enforces consent and tenancy

Those require later remediation PRs and runtime verification.
