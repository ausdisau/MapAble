# Remediation — Risk Register

Status values: `verified` | `likely` | `needs_runtime_verification` | `not_present` | `already_remediated`

Severity: critical | high | medium | low

| ID  | Risk                                                                       | Severity    | FindingStatus | Target PR                    | Notes                                    |
| --- | -------------------------------------------------------------------------- | ----------- | ------------- | ---------------------------- | ---------------------------------------- |
| R01 | NDIS encryption falls back to `NEXTAUTH_SECRET` / static string            | critical    | verified      | PR 2                         | `lib/crypto/ndis.ts`                     |
| R02 | Duplicate migration timestamp `20260525000000`                             | critical    | verified      | PR 1                         | Blocks trustworthy migrate-from-zero     |
| R03 | No required CI / branch-protection evidence for lint/test/build/migrations | critical    | verified      | PR 1                         | Only Semgrep + Replit sync               |
| R04 | ESLint ignored during builds; full lint OOM                                | high        | verified      | PR 1                         | `ignoreDuringBuilds: true`               |
| R05 | Admin role grants all permissions ambiently                                | high        | verified      | PR 3                         | `hasPermission` short-circuit            |
| R06 | Accountability publish creates `published` in one step                     | high        | verified      | PR 11                        | No privacy/safeguarding reviews          |
| R07 | Transport mock routing can masquerade as available                         | high        | verified      | PR 2                         | Default provider `mock`, routing enabled |
| R08 | Parallel billing/invoice aggregates                                        | high        | verified      | PR 5                         | `Invoice` vs `BillingInvoice` vs NDIS    |
| R09 | Parallel transport booking models                                          | high        | verified      | PR 7–8                       | `TransportBooking` vs `TransportTrip`    |
| R10 | Consent omission not fail-closed on all sensitive paths                    | high        | likely        | PR 4                         | Sparse route-level checks                |
| R11 | Many API routes pass raw JSON into services                                | high        | verified      | PR 3+                        | ~158 routes without Zod (approx)         |
| R12 | `/admin` and `/employer` missing middleware auth prefixes                  | medium-high | verified      | PR 3                         | Layout guards exist for admin            |
| R13 | Phase12 / civic flags default-on without assurance                         | medium-high | verified      | PR 2                         | `!== "false"` pattern                    |
| R14 | Docs prescribe `prisma db push` for phase deploy                           | medium-high | verified      | PR 1 claim scan + PR 12 docs | Ops docs partially warn                  |
| R15 | Xero / Stripe dual paths and stubs                                         | medium      | verified      | PR 5                         | Placeholder sync                         |
| R16 | Care invoice placeholders as financial state                               | medium      | verified      | PR 6                         | Placeholder status                       |
| R17 | Driver/employer UI shells auth-only                                        | medium      | verified      | PR 3                         | API permissions stronger                 |
| R18 | No Playwright/axe accessibility CI                                         | medium      | verified      | PR 1                         | jsx-a11y only                            |
| R19 | Public “NDIS registered” provider labels                                   | medium      | verified      | PR 2 claims                  | Misread as MapAble certification risk    |
| R20 | Mobile contracts without offline security design                           | medium      | verified      | PR 13                        | Not a native app                         |

## Residual / needs runtime verification

| ID  | Risk                                                        | FindingStatus              |
| --- | ----------------------------------------------------------- | -------------------------- |
| R21 | Deployed Vercel env missing `NDIS_ENCRYPTION_KEY`           | needs_runtime_verification |
| R22 | Live marketing pages over-claim availability                | needs_runtime_verification |
| R23 | Production DB already recorded one duplicate migration name | needs_runtime_verification |
| R24 | Migrate-from-zero P3018 at `mapable_access_phase_1` + stubs | verified (hard CI fail)    |
| R25 | CSP Report-Only with `unsafe-eval` (enforce not proven)     | verified                   |
| R26 | Branch protection / independent approval not API-verified   | needs_runtime_verification |
| R27 | Production JSON-LD still localhost until #378 deployed      | verified (edge scan)       |
| R28 | Authenticated a11y / zoom / reduced-motion coverage gaps    | likely (improved in #378)  |

## Risk acceptance

No critical risk is accepted as closed merely because documentation exists. Closure requires tests, CI gates, and (for crypto/auth/billing) specialist review per `docs/operations/branch-protection.md`.

## Risk acceptance

No critical risk is accepted as closed merely because documentation exists. Closure requires tests, CI gates, and (for crypto/auth/billing) specialist review per `docs/operations/branch-protection.md`.
