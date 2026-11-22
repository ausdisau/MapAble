# MapAble Commerce — Continuous Capability Benchmark and Release Scorecard

**Status:** Proposed, docs-only standard for future Marketplace design, engineering and review.
**Evidence date:** 31 October 2026.
**Scope:** Marketplace, shared MapAble Core identity/consent, PayCore/AbilityPay payment interfaces, web/mobile discovery, supplier operations and service recovery.

## North-star outcome

Match the reliability and merchant usability of established commerce platforms without sacrificing the will and preferences of the disabled person, accessible communication, safe product information, evidence provenance or funding transparency.

A strong benchmark means people can independently compare, enquire, prepare, confirm, cancel, contest and obtain help with a purchase, rental, reuse exchange or service request.

## Scoring rules — not an automatic launch score

Rate each criterion by evidence, **not aspiration**:

- **0 — Missing / unverified:** no reproducible evidence.
- **1 — Proposed:** approved specification, model or static demonstration but no end-to-end tested behaviour.
- **2 — Implemented, not independently verified:** running code and relevant automated synthetic tests; still gated.
- **3 — Independently assured:** passing integration, accessibility, safety/security and operational rehearsal with reviewed exact SHA; production claims additionally require live evidence.

A zero for any **critical** safety, payment authority, supplier verification or accessibility item is a **release veto**, regardless of total score. Do not average critical gaps away.

## Evidence ledger

| Capability | Current documented evidence | Claim status | Gap to assess |
| --- | --- | --- | --- |
| Modular public catalogue | apps/web/lib/marketplace/catalog.ts and types.ts in canonical repo | Implemented, not independently verified | Real suppliers, trustworthy data, price provenance |
| Transactional Marketplace | apps/web/lib/config/year-one-scope.ts default-off flag | In development | No approved production checkout |
| Fair ranking and choice | apps/web/docs/marketplace-fairness-and-safety.md | Documented / proposed operational scope | Independent user testing and operational review |
| Inclusive storefront | Standalone draft #641 in ausdisau/mapableau-new | In development; **not imported into canonical main** | Reconciliation, exact build and participant-led tests |
| Synthetic supplier-order lifecycle | Draft #642 (stacked) in standalone repository | In development | Real evidence/stock/returns/payout not provided |
| Cross-vertical PayCore | Draft #643 in standalone repository | Proposed/in development | Reconciliation, durable payment and legal duties |
| Canonical monorepo | ausdisau/MapAble README.md and amalgamation record | Documented | October code parity not verified |

## Feature parity and excellence matrix

| ID | Reference pattern | MapAble target | Priority | Required evidence | Safety blocker |
| --- | --- | --- | --- | --- | --- |
| C01 | PrestaShop catalogue and product combinations | Product, rental, reuse, digital and services with accessible attributes and variants | P0 | Fixture CRUD + validation and accessible search/filter tests | Unknown safety/condition misrepresented |
| C02 | Zen Cart attributes and call-for-price | Correct purchase/enquiry/assessment route per product risk | P0 | Type-state tests and specialist product exclusions | High-risk product can enter direct checkout |
| C03 | Adobe B2B quotes and requisition lists | Saved participant-owned shortlists, reviewable versions, accessible quotes | P0 | Quote revisions, timeouts, cancellation and consent tests | Delegate can approve without grant |
| C04 | PrestaShop merchant back office | Seller draft, submission, reviewer evidence, explainable status, appeal | P0 | Scoped seller/tenant and reviewer workflows | Self-approval or cross-tenant data exposure |
| C05 | Zen Cart shipping and stock | Accessible delivery/collection options, stock/version and condition evidence | P1 | Concurrent reservation, repair/return and outage tests | Duplicate or false reservation |
| C06 | osCommerce module/app interfaces | Versioned PayCore, delivery, tax and import adapters | P1 | Contract tests, licence/security review | User-supplied prices accepted as payable |
| C07 | Adobe modular transactional services | Separate read-only discovery, authoritative quote, order, payment and refunds | P0 | Source-ownership ADR + integration tests | Browser checkout bypasses server pricing |
| C08 | PrestaShop multistore | Organisation and seller tenancy without leaking participant data | P1 | RBAC/ABAC, tenancy and withdrawal tests | Cross-tenant access |
| C09 | Adobe company approval rules | Employer purchasing and supplier permissions; participant-specific delegated assistance | P0 | Real auth grants, expiry, revocation and audit | Mode-switch confers approval rights |
| C10 | osCommerce sales channels | MapAble web/mobile parity for approved read-only discovery then scoped authenticated actions | P1 | Web/mobile contract tests, error/offline fallback | Sensitive data sent without consent |
| C11 | Zen Cart product review and support | Accessible seller correction, dispute and complaint resolution | P0 | Human support rehearsal and accessibility tests | No escalation or unsafe product recall path |
| C12 | Enterprise admin reporting | Ethical operational KPIs: stale listings, disputes, refunds, supply and access outcome | P2 | Query and source-level evidence; no surveillance profiling | Diagnosis used for conversion targeting |
| C13 | Enterprise checkout reliability | One source-verified funding route per charge, idempotency and reconciliation | P0 | Duplicate webhook/retry/bank settlement simulation | Double charge or unapproved payout |
| C14 | Accessible first-party design system | Keyboard, AAC, switch, screen reader, 200–400% zoom and human fallback | P0 | Manual+automated test ledger with participant input | Critical path unusable |
| C15 | Catalog and audit provenance | Seller-stated vs verified, scope, date, expiry, audit and dispute | P0 | Evidence-source and expiry review in all core records | Unverified "safe"/"NDIS funded" label |
| C16 | Marketplace ethical differentiation | No paid placement in fit ranking, participant-selected filters and alternatives | P0 | Ranking and disclosure unit/integration tests | Commercial pressure controls choice |

"Documented", "implemented" and "in development" are **not equal** to a production-ready module.

## Reference platform comparison rhythm

A design/release review for each relevant change should answer:

1. Which exemplar provides the simplest proven user or merchant pattern?
2. Why should MapAble follow, adapt or reject that pattern for disabled participants and supporters?
3. Which feature and data contract belongs in MapAble Core, Marketplace or AbilityPay/PayCore?
4. What consent, evidence, safety, pricing and tax information must remain visible?
5. What happens for denial, cancelled transaction, unavailable supplier, failed payment, refund, dispute or inaccessible service?
6. Which automated, assistive-technology and participant-led tests demonstrate the intended outcome?
7. Does the benchmark introduce vendor licensing, data-sharing, admin complexity or operating cost that undermines MapAble's social-enterprise purpose?

## Phase-gated delivery sequence

### Phase 0 — Evidence and architecture alignment

- **Outcome:** One canonical development baseline, unchanged safety flags and reviewed domain ownership.
- **Technical owner:** Identify canonical SHA, source PR compatibility, schema migrations, Prisma/Next.js/Expo dependency isolation, security advisories and current deployment restrictions.
- **Exit evidence:** Reviewed merge plan for standalone #641/#642/#643 and consolidated architectural decision log. No blind subtree sync.
- **Veto:** Unknown source of truth for orders, payment/consent or conflicting schema migrations.

### Phase 1 — Catalogue and merchant tooling

- **Outcome:** One complete synthetic participant-to-reviewed-seller journey.
- **Exemplars:** PrestaShop Admin, Zen Cart product types and osCommerce catalogue operations.
- **Exit evidence:** C01, C02, C04, C15 and C16 at level 2 or higher; keyboard, AAC and screen-reader scenarios reproduced; specialist AT is enquiry-only.
- **Veto:** Supplier self-verifies or an unsafe item is presented as purchasable.

### Phase 2 — Assisted procurement and quote workflows

- **Outcome:** Saved shortlist, shared *with permission*, scope-bound quote preparation and explicit participant review.
- **Exemplars:** Adobe Commerce B2B quotes and reusable requisition lists, **adapted to autonomy**.
- **Exit evidence:** C03, C07, C09 and C14 at level 2 or higher; revoked/expired delegate and stale-price cases fail closed.
- **Veto:** Support coordinator can authorise an order without separately verified legal and participant authority.

### Phase 3 — Fulfilment, refund and staff operations

- **Outcome:** Distinct order, rental, installation, return, refund, recall, complaint and service-recovery cases.
- **Exemplars:** Zen Cart shipping modules, PrestaShop administration, osCommerce operations.
- **Exit evidence:** C05, C08, C11 at level 2+ in synthetic test and verified staff procedures; reversible state transitions and no lost incident/escalation event.
- **Veto:** No accountable refund/returns officer or unsafe high-risk reuse path.

### Phase 4 — Payment readiness and controlled pilot decision

- **Outcome:** Source-verified fees and taxes, approved payment-provider contracts, permissioned checkout and PSP-to-ledger reconciliation under explicit approval.
- **Exemplars:** Adobe Commerce transaction backend separation; PrestaShop payment modules; osCommerce adapters.
- **Exit evidence:** C06, C10, C13 at level 3 with finance/security/legal review, current NDIS/fundability classification for relevant flows, ACCC/ACL and product-safety sign-off.
- **Veto:** Client-supplied prices, unreviewed payment custody, signature mismatch, unknown seller identity, missing accessibility evidence or unreconciled funds.

### Phase 5 — Scale and supplier economics

- **Outcome:** Test sustainable seller workflows, reliability, accessible support, no-pressure acquisition and return/repair economics.
- **Exemplars:** Adobe scale and admin reports; PrestaShop back-office productivity.
- **Exit evidence:** 90-day bounded real pilot reports with appropriately consented data, verified support coverage, measured accessibility barriers and transparent seller/participant economics.
- **Veto:** Expansion beyond verified human review and service recovery capacity.

## Definition of Done for each Marketplace change

- Decision: participant value and reference platform pattern recorded; no claimed live capability without evidence.
- Architecture: changes in the owning module; no duplicate PayCore/identity/consent logic.
- Design: no forced diagnosis disclosure, inaccessible authentication, deceptive readiness badges or misleading availability/funding.
- Testing: relevant domain, state transition, role/tenant and feature-flag tests, plus failure/rollback and accessible critical flow tests.
- Payment: if relevant, verified authoritative prices, reviewable total, deterministic funding route, no automatic NDIS claim and no payout before reconciliation.
- Operations: support, cancellation, refunds, recalls, human escalation and audit/observability are linked to owner responsibilities.
- Sources: vendor capability source link and version/date captured. Legal and regulatory sources must be checked at current decision date.
- Release: exact base/head SHA, CI status, blockers, explicit human sign-off, default-off feature flag and a rollback plan.

## Risks and release controls

| Risk | Severity | Control |
| --- | --- | --- |
| False feature parity from static mockups | High | Test both user and admin workflows, with evidence status |
| Accessibility regressions from vendor-inspired patterns | Critical | WCAG 2.2 AA target; manual assistive tech + disabled user review |
| Hidden claims of NDIS eligibility, registration or AT safety | Critical | Visible unknown/evidence status; human specialist/official rule validation |
| Payments bypass PayCore or participant approval | Critical | Server-authoritative price, lawful delegation and finance veto |
| Magento/PrestaShop/Zen Cart/osCommerce code imported without licence review | High | Platform-pattern-only standard; separate legal/security/code review |
| Incompatible old and canonical repo histories | High | SHA-based merge plan; reviewed migrations and no silent code copying |
| Vendor portals expose participant profiles for sales targeting | Critical | Tenant isolation, purpose consent, no diagnosis in marketplace searches |

## Metrics for ongoing evaluation (targets, not claimed results)

- Accessible task success: 100% of critical tasks complete through tested keyboard, screen-reader and AAC/switch pathways without an unaddressed high-impact blocker.
- Buyer comprehension: compare pricing, item condition, seller evidence, quote status, return/refund and funding uncertainty correctly in moderated user tests; record comprehension problems, not vanity clicks.
- Seller readiness: proportion of published items with complete required fields, document verification and reviewed high-risk classification; no unsafe publish.
- Financial integrity: zero known unreviewed price mismatch, duplicate settlement or forced payment on a participant's behalf.
- Human recovery: meaningful time to resolve access obstacles, complaints, refunds and recall communications; use aggregate data with consent and minimal personal profiling.
- Benchmark debt: count criteria rated 0/1, release-blocker severity, verified remediation evidence and accessibility regression trends.

## Next actions

- Product owner: review and approve this scorecard as a living comparison standard; record any non-negotiable disability-led departures from conventional commerce patterns.
- Engineering lead: use the commerce-specific PR review template; inspect the real canonical repository and PayCore/Marketplace PRs before implementation.
- Accessibility lead: define test participants, devices, AAC/switch/screen-reader setup and recovery scenarios for Phase 1 and Phase 2.
- Supplier assurance lead: document review criteria and evidence retention for items, sellers, rentals and donated equipment.
- Finance/legal reviewers: validate fee/custody/claims conditions and formal payment responsibilities before Phase 4 approval.

**Stop condition:** The scorecard is an assessment aid, not permission to merge, purchase third-party plugins, accept real money, issue an NDIS claim or publish a safety claim.

## Reference documentation

- Adobe Commerce architecture: https://experienceleague.adobe.com/en/docs/commerce/information-center/architecture/implementation-architectures
- Adobe Commerce B2B: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/guide-overview
- PrestaShop 9: https://devdocs.prestashop-project.org/9/
- PrestaShop Hummingbird: https://devdocs.prestashop-project.org/9/themes/hummingbird/
- Zen Cart: https://docs.zen-cart.com/user/about_us/features/
- osCommerce: https://www.oscommerce.com/Products
- MapAble reference standard: docs/commerce/PLATFORM_REFERENCE_STANDARD.md
