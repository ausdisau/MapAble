# Remediation — Capability Inventory

States used here match the remediation vocabulary
(`concept` | `scaffold` | `demo` | `synthetic_demo` | `internal_alpha` | `controlled_pilot` |
`production_ready` | `generally_available` | `suspended` | `retired`).

ConvergenceOS seeds use a parallel enum (`scaffolded`, `fixture_only`, `shadow`, …) —
see `lib/convergence-os/seed/capabilities.ts` and
[docs/productisation/CAPABILITY_REGISTRY.md](../productisation/CAPABILITY_REGISTRY.md).

**Rule:** Feature flags and documentation are **not** evidence of production readiness.
**Updated:** 2026-07-20 — post #378 + NDIS Expansion Wave 0 docs (no product schema).

| Key                              | Title                             | Domain         | State              | publicClaimAllowed | Classification status | Evidence / gaps                                                                        |
| -------------------------------- | --------------------------------- | -------------- | ------------------ | ------------------ | --------------------- | -------------------------------------------------------------------------------------- |
| auth.sessions                    | Authentication and sessions       | auth           | internal_alpha     | false              | verified              | NextAuth; production secret policy partial                                             |
| auth.permissions                 | Permission evaluation             | auth           | internal_alpha     | false              | verified              | Ambient admin grant remains a risk                                                     |
| consent.records                  | Consent records                   | consent        | internal_alpha     | false              | verified              | Purpose-bound ConsentRecord paths                                                      |
| care.request_loop                | Care request to service log       | care           | controlled_pilot   | false              | verified              | APIs + Prisma; recurring schedules incomplete                                          |
| care.agreements                  | Accessible service agreements     | care           | controlled_pilot   | false              | verified              | Versioned agreement + accept APIs (#327); not production_supported                     |
| care.invoice_from_evidence       | Evidence-backed care invoicing    | care           | internal_alpha     | false              | verified              | billing-handoff → BillingServiceRecord; legacy invoice-placeholder retained            |
| transport.trip_ops               | TransportTrip operations          | transport      | controlled_pilot   | false              | verified              | Trip service + feature-status matrix                                                   |
| transport.routing                | Live routing                      | transport      | demo               | false              | verified              | Default provider `mock`                                                                |
| transport.quotes                 | Quotes and pricing rules          | transport      | controlled_pilot   | false              | verified              | Prisma TransportQuote + versions; accept + staged disclosure; not production_supported |
| billing.centre                   | Billing Centre invoices           | billing        | internal_alpha     | false              | verified              | `BillingInvoice` foundations + Care/Transport handoff                                  |
| billing.legacy_invoice           | Legacy Invoice model              | billing        | suspended (compat) | false              | verified              | Parallel SoT                                                                           |
| billing.ndia_submit              | NDIA claim submission             | billing        | scaffold           | false              | verified              | Mock gateway; must stay disabled                                                       |
| payments.stripe                  | Stripe payments                   | payments       | internal_alpha     | false              | verified              | Webhook dual-path; flags default off                                                   |
| accounting.xero                  | Xero sync                         | accounting     | scaffold           | false              | verified              | Placeholder OAuth/sync                                                                 |
| jobs.apply                       | Job applications                  | jobs           | internal_alpha     | false              | likely                | Basic APIs                                                                             |
| jobs.retention                   | Job retention support             | jobs           | concept            | false              | likely                | Not a complete loop                                                                    |
| safety.incidents                 | Incident intake                   | safety         | internal_alpha     | false              | verified              | `lib/incidents`                                                                        |
| safety.investigation_ops         | Investigation / Q&S ops           | safety         | scaffold           | false              | likely                | Incomplete ops loop                                                                    |
| accountability.portal            | Public accountability             | accountability | demo               | false              | verified              | One-step publish; appeals open tips                                                    |
| mobile.native                    | Native mobile apps                | mobile         | scaffold           | false              | verified              | Companion Expo foundation + contracts; not production                                  |
| mobile.pwa                       | PWA baseline                      | mobile         | concept            | false              | likely                | Not established as production baseline                                                 |
| a11y.assurance                   | Accessibility assurance programme | accessibility  | scaffold           | false              | verified              | Playwright/axe CI present; no blanket WCAG certification claim                         |
| compliance.soc2_iso              | SOC2 / ISO evidence               | compliance     | scaffold           | false              | verified              | Explicitly not certified                                                               |
| ai.public_features               | Public AI features                | ai             | internal_alpha     | false              | likely                | Multiple agent routes; governance incomplete                                           |
| access.intelligence_next         | Living Access Fabric (AI Next)    | access         | synthetic_demo     | false              | verified              | On main; not personally usable truth                                                   |
| accesscast.outlook               | AccessCast outlook                | access         | synthetic_demo     | false              | verified              | Synthetic Harbour; flags default off                                                   |
| communication.passport           | Communication Passport            | access         | controlled_pilot   | false              | verified              | Package on main (#314); flag default off; projection over AccessibilityProfile         |
| workforce.readiness              | Assignment readiness (no auto)    | workforce      | controlled_pilot   | false              | verified              | Package on main (#314); auto-assign permanently false                                  |
| provider.ops_attention           | Provider Ops attention queue      | provider       | controlled_pilot   | false              | verified              | Read-only projection on main (#327); flag default off                                  |
| mobile.companion                 | Native Companion                  | mobile         | scaffold           | false              | verified              | Expo foundation + Visit Pack APIs on main; not production Companion                    |
| outcomes.ledger                  | Outcomes and Impact Ledger        | outcomes       | concept            | false              | verified              | No immutable receipts yet                                                              |
| pilot.starting_work              | Starting Work controlled pilot    | pilot          | synthetic_demo     | false              | verified              | Synthetic journey on main (#327); DB-backed journey is programme PR 4                  |
| managed.support_delivery         | MapAble Managed Support           | provider       | concept            | false              | verified              | **blocked_by_registration** — do not fabricate                                         |
| ndis.expansion_foundation        | NDIS Expansion Wave 0 docs        | programmes     | concept            | false              | verified              | Docs/registry only; product waves blocked by migrate-from-zero                         |
| ndis.at_continuity               | Assistive Technology Continuity   | programmes     | concept            | false              | verified              | Planned Wave 1; flag default false; not implemented                                    |
| ndis.plan_manager_infrastructure | Plan Management Infrastructure    | billing        | concept            | false              | verified              | Planned Wave 10; NDIA submit + auto payment approval must stay false                   |

See also ConvergenceOS `CAPABILITY_SEEDS` and [PUBLIC_CLAIM_REGISTRY](../convergence-os/PUBLIC_CLAIM_REGISTRY.md).
Strategy lanes: [OPERATING_LANES](../strategy/OPERATING_LANES.md).
NDIS Expansion: [NDIS_EXPANSION_MASTER_PLAN](../programmes/NDIS_EXPANSION_MASTER_PLAN.md).

## Marketing language vs inventory

| Surface                            | Observation                                                  | Status   |
| ---------------------------------- | ------------------------------------------------------------ | -------- |
| `/transport` feature-status matrix | Relatively honest pilot/sandbox labels                       | verified |
| `/care` hub                        | May lag agreement/handoff APIs — keep coming-soon honest     | likely   |
| Pricing / about pages              | Avoid certification and NDIS registration claims for MapAble | verified |
| Strategy docs                      | Describe intent; never production_ready without registry     | verified |

After capability registry wiring, public availability must come from server maturity evidence,
not hard-coded marketing arrays.
