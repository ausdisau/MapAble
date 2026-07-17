# Remediation — Domain Ownership

**FindingStatus for this file's decisions:** `verified` where grounded in existing code paths; ownership rules below are **declared** for remediation and enforced by `scripts/ci/check-domain-ownership.ts` (PR 1) plus CODEOWNERS.

## Canonical owners

| Domain                      | Canonical owner                                          | Aggregate / SoT                       | Notes                                                             |
| --------------------------- | -------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Authentication and sessions | `lib/auth/**`                                            | NextAuth session / JWT                | Keep NextAuth                                                     |
| Permissions                 | `lib/auth/permissions*`                                  | Permission matrix                     | Ambient admin grant to be removed in PR 3                         |
| Consent and delegation      | `lib/consent/**`                                         | `ConsentRecord`                       | FHIR/telehealth specialised; must not become second authority SoT |
| Audit events                | `lib/audit/**`                                           | `AuditEvent`                          | Domain-specific audit adapters may emit through this boundary     |
| Care delivery               | `lib/care/**`                                            | Care request/booking/shift/log        | Generic `Booking` bridge only where required                      |
| Transport                   | `lib/transport/**`                                       | **`TransportTrip` (+ scheduling)**    | Legacy `TransportBooking` compatibility via bridge                |
| Jobs                        | `lib/jobs/**`                                            | Job / application                     | Employer ATS subordinate                                          |
| Billing and invoices        | `lib/billing/**`                                         | **`BillingInvoice` / Billing Centre** | `lib/invoices`, `lib/billing-core` become adapters then deprecate |
| Payments                    | `lib/stripe/**`                                          | Stripe adapter                        | Must not invent a second invoice SoT                              |
| Accounting                  | `lib/xero/**`                                            | Xero adapter                          | Stub until configured; never invoice SoT                          |
| Incidents and safeguarding  | `lib/incidents/**`                                       | `IncidentReport`                      | Do not collapse support tickets into incidents                    |
| Organisations and tenancy   | Organisation membership services                         | **`Organisation.id`**                 | Server-derived tenant context; no client-selected authority       |
| Accessibility evidence      | Existing access modules under `lib/access*` / access map | Access registry                       | No new parallel registry in PR 1                                  |
| Public accountability       | `lib/national-accountability/**`                         | National accountability publications  | Evolve to governed pipeline (PR 11); no second portal             |

## Mutation rule

No other module may directly mutate another domain’s aggregate tables except through its declared service or transaction boundary.

CI ownership check (`scripts/ci/check-domain-ownership.ts`) flags changed files that touch foreign aggregate write paths without going through the owner package (heuristic; expands in later PRs).

## CODEOWNERS mapping

See root `CODEOWNERS`. Specialist second review required for auth, consent, safeguarding, billing, payments, tenancy, encryption, and participant-data export (see `docs/operations/branch-protection.md`).

## Explicit non-owners

| Path pattern         | Must not own                                                         |
| -------------------- | -------------------------------------------------------------------- |
| Marketing components | Capability availability truth (registry is authoritative after PR 2) |
| Client-only role UI  | Server authorisation                                                 |
| Feature flags alone  | Production readiness / public claims                                 |
