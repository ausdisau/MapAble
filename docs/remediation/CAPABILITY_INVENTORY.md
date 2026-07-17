# Remediation — Capability Inventory

States used here match the future registry (`concept` | `scaffold` | `demo` | `internal_alpha` | `controlled_pilot` | `production_ready` | `generally_available` | `suspended` | `retired`).

**Rule:** Feature flags and documentation are not evidence of production readiness. Status values below are inspection classifications (`FindingStatus` on the classification itself).

| Key                        | Title                             | Domain         | State              | publicClaimAllowed | Classification status | Evidence / gaps                              |
| -------------------------- | --------------------------------- | -------------- | ------------------ | ------------------ | --------------------- | -------------------------------------------- |
| auth.sessions              | Authentication and sessions       | auth           | internal_alpha     | false              | verified              | NextAuth; production secret policy partial   |
| auth.permissions           | Permission evaluation             | auth           | internal_alpha     | false              | verified              | Ambient admin grant remains                  |
| consent.records            | Consent records                   | consent        | internal_alpha     | false              | verified              | No rich ConsentDecision yet                  |
| care.request_loop          | Care request to service log       | care           | controlled_pilot   | false              | likely                | APIs exist; agreements/invoices incomplete   |
| care.agreements            | Accessible service agreements     | care           | scaffold           | false              | verified              | Placeholder statuses in care paths           |
| care.invoice_from_evidence | Evidence-backed care invoicing    | care           | scaffold           | false              | verified              | invoice-placeholder route                    |
| transport.trip_ops         | TransportTrip operations          | transport      | controlled_pilot   | false              | verified              | Trip service + feature-status matrix         |
| transport.routing          | Live routing                      | transport      | demo               | false              | verified              | Default provider `mock`                      |
| transport.quotes           | Quotes and pricing rules          | transport      | scaffold           | false              | likely                | Docs require first-class quotes              |
| billing.centre             | Billing Centre invoices           | billing        | internal_alpha     | false              | verified              | `BillingInvoice` foundations                 |
| billing.legacy_invoice     | Legacy Invoice model              | billing        | suspended (compat) | false              | verified              | Parallel SoT                                 |
| billing.ndia_submit        | NDIA claim submission             | billing        | scaffold           | false              | verified              | Mock gateway; must stay disabled             |
| payments.stripe            | Stripe payments                   | payments       | internal_alpha     | false              | verified              | Webhook dual-path; flags default off         |
| accounting.xero            | Xero sync                         | accounting     | scaffold           | false              | verified              | Placeholder OAuth/sync                       |
| jobs.apply                 | Job applications                  | jobs           | internal_alpha     | false              | likely                | Basic APIs                                   |
| jobs.retention             | Job retention support             | jobs           | concept            | false              | likely                | Not a complete loop                          |
| safety.incidents           | Incident intake                   | safety         | internal_alpha     | false              | verified              | `lib/incidents`                              |
| safety.investigation_ops   | Investigation / Q&S ops           | safety         | scaffold           | false              | likely                | Incomplete ops loop                          |
| accountability.portal      | Public accountability             | accountability | demo               | false              | verified              | One-step publish                             |
| mobile.native              | Native mobile apps                | mobile         | concept            | false              | verified              | Contracts only                               |
| mobile.pwa                 | PWA baseline                      | mobile         | concept            | false              | likely                | Not established as production baseline       |
| a11y.assurance             | Accessibility assurance programme | accessibility  | scaffold           | false              | verified              | Statement cautious; no axe CI before PR 1    |
| compliance.soc2_iso        | SOC2 / ISO evidence               | compliance     | scaffold           | false              | verified              | Explicitly not certified                     |
| ai.public_features         | Public AI features                | ai             | internal_alpha     | false              | likely                | Multiple agent routes; governance incomplete |
| access.intelligence_next   | Living Access Fabric (AI Next)    | access         | synthetic_demo     | false              | verified              | On main; not personally usable truth         |
| communication.passport     | Communication Passport            | access         | concept            | false              | verified              | Not on main as package yet                   |
| workforce.readiness        | Assignment readiness (no auto)    | workforce      | concept            | false              | verified              | Package missing on main                      |
| provider.ops_attention     | Provider Ops attention queue      | provider       | concept            | false              | verified              | Read-only projection not landed              |
| mobile.companion           | Native Companion                  | mobile         | scaffold           | false              | verified              | Contracts only; Expo not on main             |
| outcomes.ledger            | Outcomes and Impact Ledger        | outcomes       | concept            | false              | verified              | No immutable receipts yet                    |
| pilot.starting_work        | Starting Work controlled pilot    | pilot          | concept            | false              | verified              | Design pending security + vertical slice     |

See also ConvergenceOS `CAPABILITY_SEEDS` and [PUBLIC_CLAIM_REGISTRY](../convergence-os/PUBLIC_CLAIM_REGISTRY.md).

## Marketing language vs inventory

| Surface                            | Observation                                | Status   |
| ---------------------------------- | ------------------------------------------ | -------- |
| `/transport` feature-status matrix | Relatively honest pilot/sandbox labels     | verified |
| `/care` hub                        | Lists some implemented APIs as coming soon | likely   |
| Pricing / about pages              | Avoid some certification claims            | verified |

After PR 2, public availability must come from the server capability registry, not hard-coded marketing arrays.
