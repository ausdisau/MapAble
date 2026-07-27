# Remediation — Domain Ownership

**FindingStatus for this file's decisions:** `verified` where grounded in existing code paths; ownership rules below are **declared** for remediation and enforced by `scripts/ci/check-domain-ownership.ts` (PR 1) plus CODEOWNERS.

## Canonical owners

| Domain                      | Canonical owner                                          | Aggregate / SoT                              | Notes                                                                   |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Authentication and sessions | `lib/auth/**`                                            | NextAuth session / JWT                       | Keep NextAuth                                                           |
| Permissions                 | `lib/auth/permissions*`                                  | Permission matrix                            | Ambient admin grant to be removed in PR 3                               |
| Consent and delegation      | `lib/consent/**`                                         | `ConsentRecord`                              | FHIR/telehealth specialised; must not become second authority SoT       |
| Audit events                | `lib/audit/**`                                           | `AuditEvent`                                 | Domain-specific audit adapters may emit through this boundary           |
| Care delivery               | `lib/care/**`                                            | Care request/booking/shift/log               | Generic `Booking` bridge only where required                            |
| Transport                   | `lib/transport/**`                                       | **`TransportTrip` (+ scheduling)**           | Legacy `TransportBooking` compatibility via bridge                      |
| Jobs                        | `lib/jobs/**`                                            | Job / application                            | Employer ATS subordinate                                                |
| Billing and invoices        | `lib/billing/**`                                         | **`BillingInvoice` / Billing Centre**        | `lib/invoices`, `lib/billing/core` become adapters then deprecate       |
| Payments                    | `lib/stripe/**`                                          | Stripe adapter                               | Must not invent a second invoice SoT                                    |
| Accounting                  | `lib/xero/**`                                            | Xero adapter                                 | Stub until configured; never invoice SoT                                |
| Incidents and safeguarding  | `lib/incidents/**`                                       | `IncidentReport`                             | Do not collapse support tickets into incidents                          |
| Organisations and tenancy   | Organisation membership services                         | **`Organisation.id`**                        | Server-derived tenant context; no client-selected authority             |
| Accessibility evidence      | Existing access modules under `lib/access*` / access map | Access registry                              | No new parallel registry in PR 1                                        |
| Access place identity       | `lib/access/map/**`                                      | **`AccessPlace`**                            | Sole public place writer                                                |
| Access Intelligence Next    | `lib/access/intelligence-next/**`                        | Deterministic fit / proof / graph projection | Synthetic contracts only in foundation; must not become AccessPlace SoT |
| Public accountability       | `lib/governance/national-accountability/**`              | National accountability publications         | Evolve to governed pipeline (PR 11); no second portal                   |
| Support coordination        | `lib/support/coordinator/**`                             | `SupportCoordinatorRelationship` + tasks     | Outcomes reporting extends this owner — no second SC SoT                |
| Plan manager workflows      | `lib/support/plan-manager/**`                            | PM relationships + invoice review            | Wave 10 infrastructure extends; NDIA submit stays off                   |
| Provider quality            | `lib/provider/quality/**`                                | Quality / safeguard review services          | No worker worthiness scores                                             |
| Workforce readiness         | `lib/workforce/readiness/**`                             | Reason-coded readiness evaluation            | Auto-assign permanently forbidden                                       |

### NDIS Expansion — planned owners (no writers on main yet)

Declared for programme control. Paths must not be treated as existing SoT writers
until their wave lands behind default-false flags. See
[docs/programmes/NDIS_EXPANSION_DOMAIN_MAP.md](../programmes/NDIS_EXPANSION_DOMAIN_MAP.md).

| Planned domain                    | Planned owner path              | Status                                                                                                      |
| --------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| AT Continuity                     | `lib/platform/at-continuity/**` | Wave 1 scaffold in #382 — writers flag-gated (`MAPABLE_AT_CONTINUITY_ENABLED=false`); not on main yet       |
| Plan & Evidence Navigator         | `lib/plan-evidence/**`          | planned — **no writers yet**                                                                                |
| Home & Living Navigator           | `lib/home-living/**`            | planned — **no writers yet**                                                                                |
| Psychosocial Recovery             | `lib/psychosocial-recovery/**`  | planned — **no writers yet**                                                                                |
| PBS Operations                    | `lib/pbs-operations/**`         | planned — **canonical Wave 7 owner**; #379’s `lib/positive-behaviour-support/**` is non-canonical / blocked |
| Early Childhood                   | `lib/early-childhood/**`        | planned — **no writers yet**                                                                                |
| Allied Health / Home Mod Exchange | `lib/allied-health-exchange/**` | planned — **no writers yet**                                                                                |
| Regional Capacity Exchange        | `lib/regional-capacity/**`      | planned — **no writers yet**                                                                                |

## Mutation rule

No other module may directly mutate another domain’s aggregate tables except through its declared service or transaction boundary.

CI ownership check (`scripts/ci/check-domain-ownership.ts`) flags changed files that touch foreign aggregate write paths without going through the owner package (heuristic; expands in later PRs).

Cross-domain **read/orchestration** adapters allowlisted in that script (not second SoTs): `lib/matching/`, `lib/ai/matching/`, `lib/ai/platform/`, `lib/platform/mission-portfolio/`, `lib/ai/mission-copilot/`, `lib/ai/case-copilot/`, `lib/programmes/`, plus existing orchestration/booking-graph packages. They must not become care/transport/billing writers. Programme services may store foreign-key references (e.g. `consentRecordId`, `careRequestId`) without owning those aggregates.

## CODEOWNERS mapping

See root `CODEOWNERS`. Specialist second review required for auth, consent, safeguarding, billing, payments, tenancy, encryption, and participant-data export (see `docs/operations/branch-protection.md`).

## Explicit non-owners

| Path pattern         | Must not own                                                         |
| -------------------- | -------------------------------------------------------------------- |
| Marketing components | Capability availability truth (registry is authoritative after PR 2) |
| Client-only role UI  | Server authorisation                                                 |
| Feature flags alone  | Production readiness / public claims                                 |
