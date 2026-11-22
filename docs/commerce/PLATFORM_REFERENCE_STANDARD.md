# MapAble Commerce Reference Standard — Adobe Commerce, PrestaShop, Zen Cart and osCommerce

**Status:** Proposed standing product and architecture benchmark, for review by Australian Disability Ltd.
**Date of research:** 31 October 2026.
**Audience:** MapAble Marketplace designers, engineers, participant advocates, support coordinators, seller-operations reviewers, PayCore developers and release approvers.
**Repository:** https://github.com/ausdisau/MapAble
**Decision type:** Capability benchmarking; NO third-party software installation, licence purchase, platform migration or production release.

## Decision and recommendation

MapAble should retain its **existing React/Next.js/TypeScript and MapAble Core architecture** and adopt an evidence-based **best-of commerce reference standard**. Adobe Commerce (historically Magento Commerce), PrestaShop, Zen Cart and osCommerce are design exemplars, not an implementation dependency or evidence that MapAble possesses their features.

**Why:** Participants need the commercial reliability of established shopping platforms plus accessibility-first product evidence, independent choice, AAC-friendly communication, purpose-bound delegate assistance, safe assistive-technology trials/reuse, accessible human support, and distinct NDIS funding pathways. Selling to and buying from people with disability must not require disclosure of diagnosis or identity as a disability-owned business.

## Evidence ledger and current state

| Claim or dependency | Status | Evidence | Consequence |
| --- | --- | --- | --- |
| Canonical repository contains separate web and mobile roots | Documented in current canonical main | ausdisau/MapAble README.md and docs/repository-amalgamation.md at b51cb9b73395769c46c3f64dd6094120bc2cedac | Keep app-root dependency isolation and shared MapAble Core |
| Marketplace is feature-gated by default | Implemented, not independently verified in production | apps/web/lib/config/year-one-scope.ts; MAPABLE_MARKETPLACE_ENABLED default false | Do not describe browsing, live checkout or sellers as launched |
| Baseline Marketplace fairness boundaries exist | Documented | apps/web/docs/marketplace-fairness-and-safety.md | No pay-to-rank, manipulation of disability data, or automatic choices |
| Later inclusive Marketplace design | In development; separate repository PR | ausdisau/mapableau-new draft PR #641 | Do not assume code is in the canonical monorepo |
| Later synthetic order/reconciliation assurance | In development; separate repository PR | ausdisau/mapableau-new draft PR #642, stacked on #641 | Cannot be presented as payment fulfilment or real safety verification |
| Shared PayCore architecture | Proposed/in development; separate repository PR | ausdisau/mapableau-new draft PR #643 | Card capture, NDIS claims and payouts remain out of scope |
| Canonical migration and later sync | Partial evidence | Canonical import e0a8b690; canonical main b51cb9b7 (17 Aug 2026); standalone main 4a50f790 (31 Oct 2026) | Do not auto-merge or presume parity before verified reconciliation |
| Exemplar platform capabilities | Official vendor documentation, research snapshot | Links at end | Use as benchmarks; confirm exact version and licence before adopting code |

## What to adopt, adapt and avoid

### 1. Adobe Commerce — enterprise architecture and B2B workflows

**Verified exemplar patterns:** Separate headless storefront, commerce foundation / API services, explicit transaction system of record, catalog/search services, company accounts, negotiable quotes, purchasing approvals, reusable requisition lists, multi-role permissions and GraphQL/REST contracts.

**Adopt:** Public discovery separated from trusted quotes and orders; clear domain ownership; stable APIs to web/mobile; seller/organisation approval workflows; enterprise supplier accounts; reusable wishlists/quote lists; auditable order and amendment history.

**Adapt:** Adobe's company purchase authority is not equivalent to a participant's personal or legal delegate authority. A support coordinator or carer can prepare options only with an explicit, revocable, purpose-limited grant. Participant confirmation remains its own decision gate. Contract pricing must be transparent and must not produce NDIS-specific price discrimination.

**Avoid:** Using Adobe's marketing/personalisation model to rank people by diagnosis, support intensity or perceived value; vendor lock-in as a substitute for MapAble's independent accessibility evidence; installing Adobe Commerce solely because it offers mature checkout.

### 2. PrestaShop — merchant operations and extension discipline

**Verified exemplar patterns:** Product catalogue and combinations, merchant back office, reusable modules/hooks, multistore context, admin API with OAuth2 and domain-oriented CQRS, internationalisation and accessible Hummingbird theme guidance.

**Adopt:** Seller self-service draft and moderation; a staff review queue; modular shipping, payment and tax adapters; product attribute and media validation; staged import/export; back-office search/filter/bulk actions; documented extension points with contract tests.

**Adapt:** A "multistore" concept should represent seller organisations and catalog contexts under tenant-authorised MapAble Core, not unconstrained multi-tenant data sharing. Sellers must submit condition, ownership, recall and service provenance before publication of higher-risk assistive technology. No vendor auto-approval.

**Avoid:** Installing PHP modules into the TypeScript platform without a versioned adapter and licence/security review; treating accessibility assertions from third-party themes as proof of MapAble WCAG conformity.

### 3. Zen Cart — explainable products and dependable shopping basics

**Verified exemplar patterns:** Product attributes and variants, configurable quotes or "call for price", payment and shipping modules, order totals, categories, vouchers and approachable administrator controls; vendor documentation advertises a responsive accessible template.

**Adopt:** "Buy", "request quote", "rent/trial", "exchange/donate", "book service" and "specialist review" as distinct product action types; product-specific options and compatibility; clear minimum/maximum quantities, return policies and shipping/pickup modes.

**Adapt:** Purchase/quote states must not bypass clinical fit, safety, seller responsibility or buyer confirmation. An item's disability-use category is not a clinical suitability verdict.

**Avoid:** Assuming one universal shopping cart, one shipping rate or a display-only product record can safely represent complex powered mobility, seating, respiratory devices or clinical equipment.

### 4. osCommerce — modular, admin-operable commerce and channels

**Verified exemplar patterns:** osCommerce 4 advertises modular applications, multi-channel commerce, APIs, product/stock management and integrations with common payment methods.

**Adopt:** Capability modules with versioned interfaces, provider-agnostic payment routing, explicit stock/inventory state, safe imports, administrative reconciliation and separate web/mobile channel clients.

**Adapt:** Add accessibility/communication preferences and quote/consent evidence to every relevant channel. Share a canonical MapAble Core/PayCore workflow; do not create one independent cart/payment truth per sub-brand.

**Avoid:** Adopting channel expansion without seller governance, secure integration boundaries, customer-support capacity or reconciliation controls.

## Architecture — MapAble's benchmark target

~~~mermaid
flowchart TD
  Web["Accessible Web Storefront"] --> Catalog["Marketplace Catalog and Evidence Read API"]
  Mobile["MapAble Mobile"] --> Catalog
  Seller["Seller/Staff Review UI"] --> Catalog
  Catalog --> Review["Supplier/Product Evidence + Human Review"]
  Catalog --> Quote["Trusted Cart / Quote / Rental / Service Workflows"]
  Core["MapAble Core: identity, consent, grants, audit, support"] --> Review
  Core --> Quote
  Quote --> Orders["Source-verified Orders + Fulfilment + Returns"]
  Orders --> Pay["AbilityPay / PayCore approved funding router"]
  Pay --> PSP["External licensed PSP (only after approval)"]
  Pay --> Export["Plan-manager / organisation invoicing"]
  Pay --> Claims["Authorised provider claims preparation"]
  Pay --> Ledger["Financial events + reconciliation"]
  Orders --> Support["Accessible complaints and human resolution"]
~~~

**The diagram is proposed; it is not a map of verified live transaction integrations.**

Keep one canonical record per seller, listing, price revision, consent grant, quote, order, invoice/payment reference, return, dispute, ledger entry and audit event. Service-specific records stay with Care, Transport and Jobs; PayCore receives authorised, opaque source references. Employee wages, payroll tax and superannuation must stay in a legally appropriate payroll service, not Marketplace seller payouts.

**Architecture choice:** Headless modular monolith with stable contracts and risk-based adapters is preferred over installing Adobe Commerce/PrestaShop/Zen Cart/osCommerce and duplicating MapAble identity, billing or participant profiles. Reconsider only if a source-backed cost, security, licensing, accessibility, operational and migration evaluation demonstrates a better outcome.

## Product types and workflows

| Offering | Catalogue and pricing requirements | Safe route |
| --- | --- | --- |
| Lower-risk physical product | Seller, variant, unit, price/tax, stock, shipping, warranty, evidence unknowns | Browse -> compare -> quote -> participant-approved order -> PayCore (future) |
| Assistive technology requiring assessment | Condition, model/serial, ownership, fitting/compatibility, recall, maintenance, specialist scope | Enquiry/assessment/quote; NO one-click purchase |
| Used equipment/reuse | Owner authority, sanitation, condition, recall, seller responsibility, transport/transfer | Moderated exchange/transfer and human review |
| Equipment rental/trial | Start/end, deposit, hygiene, insurance, damage/return terms, maintenance, continuity | Vendor-reviewed rental quotation and agreement |
| Digital good | Format accessibility, licences, compatibility, downloads, returns and updates | Explicit digital terms -> approved purchase when available |
| Personal/professional service | Provider qualifications, scope, booking evidence, cancellation, consent | Service enquiry and approved booking, NOT ordinary stocked SKU |
| Care or Transport charge | Service/trip agreement, actual evidence and participant review | Separate domain source -> PayCore funding route after gate |
| Employer subscription/service | Organisation contract, quote/tax, approval and recipient | Organisation invoice or approved PSP; NEVER worker wages |

Buyer, chosen supporter, support coordinator, vendor, compliance reviewer and finance reviewer must have distinct scoped capabilities. View-mode switching must NEVER create account authority.

## Accessibility acceptance — competitive advantage, not an enhancement

**Target WCAG 2.2 AA plus meaningful disability-led usability testing.**

- 100% of critical create, compare, quote, confirm, dispute, return and support paths usable with keyboard, screen reader, switch input and AAC-compatible text input; audit each failed variant.
- At least 200% text resize and 400% browser zoom/reflow without hidden pricing, consent, order totals or actions.
- No colour-only risk or verification status; truthful labels for "unknown", "seller stated", "reviewed" and "independently verified", each with scope/date.
- Touch targets at least 44 CSS pixels or an equivalent accessible platform arrangement; focus order and target spacing checked.
- Alternative to maps/images, readable instructions, captions/transcripts where relevant, reduced motion, adequate contrast and accessible authentication.
- Plain-language pricing, taxes, cancellation and funding limitations; save/return and time-extension/retry without losing control.
- Accessible human help and complaints without requiring an unauthorised supporter or family member to act for the participant.
- Privacy-by-design: no diagnosis necessary for ordinary shopping; no hidden profiling or ranking using disability/NDIS status.
- Genuine disabled user testing across varied mobility, communication, cognitive, sensory and fluctuating needs; automated accessibility scans alone are insufficient.

## Security, privacy, financial trust, consumer rights and failure recovery

- Catalogue reads may be public, but account data, seller operations and quote/order transitions require scoped identity and tenant checks.
- Client supplies listing/variant/quantity only. Server resolves canonical unit prices, tax, shipping, inventory, supplier approval and versioned fee terms. Reject client-supplied funding claims.
- Prevent double order, replayed payment, duplicate seller payouts, stale stock/version quotes and race conditions via unique idempotency keys and atomic state changes.
- All payment gateway webhooks need verified signatures and environment binding, durable retries, deduplication, dead-letter inspection and settlement reconciliation. A browser redirect is not settlement evidence.
- Distinguish self-managed purchase, plan-manager invoicing, NDIA-managed authorised provider claims, organisation invoices and mixed funding with independent legs.
- Defend participant autonomy: an invited supporter may shortlist or prepare only within documented purpose, time, expiry and revocation boundaries; confirm/payment still requires verified authorisation.
- Publish accessible returns, complaints, recall notices, repair/replacement routes and human escalation; label unresolved conflicts rather than using a favourable overall product score.
- Verify **current official** NDIS rules, Australian Consumer Law, ACCC product-safety requirements, applicable TGA medical-device obligations, privacy and payment licensing obligations for the actual business model before live commerce.
- External-service failure: retain user draft, explain which step could not complete, never pretend an invoice/order/payment was created, provide a manual path and avoid double charges on retry.
- Keep Marketplace and AbilityPay financial execution gates OFF until independent technical, legal, finance, safety, accessibility and operations approval.

## Options considered and trade-offs

| Option | Opportunity | Cost and risk | Decision |
| --- | --- | --- | --- |
| Full Adobe Commerce integration / replatform | Mature B2B and enterprise feature set | Licensing/hosting, system-of-record duplication, MapAble integration effort | Reject now; benchmark only |
| PrestaShop or Zen Cart/osCommerce PHP storefront inside MapAble | Fast established basic commerce capabilities | Split runtime, duplicated identity/payment policy, migrations, maintenance, multi-vendor extensions | Reject now; benchmark only |
| Native Next.js/TypeScript commerce with reference capability parity | One MapAble identity, accessibility evidence, Core/PayCore reuse, controlled scopes | Requires deliberate product and operational engineering | **Recommended**, phased, feature-flagged |
| Remain only an informational catalogue | Low immediate financial and regulatory load | Does not solve procurement, supplier tooling or transaction value | Valid fallback until live commerce gates pass |

## Risks and mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Presuming exemplar platform functionality is already in MapAble | High | Every capability requires a status, code path, test, operational owner and release evidence |
| Copying third-party themes, templates, code, logos or extension packages | High | Do not copy by default; review licence, attribution, third-party notices, security and trademark restrictions before proposed reuse |
| Inappropriate purchase or resale of high-risk AT | Critical | Product risk taxonomy, seller verification, recalls and specialist route; no unrestricted checkout |
| User-supplied prices, duplicate capture or payout misallocation | Critical | PayCore server-authoritative charges, durable idempotency, accounting/PSP reconciliation and independent review |
| Support coordinator or carer becomes de facto decision-maker | Critical | Explicit scoped grants, accessible participant confirmation, revocation, audit and human escalation |
| Dark patterns and disability-based sales targeting | High | No paid ranking, hidden commissions, urgency pressure or individual diagnosis profiling |
| Dependence on one vendor or payment processor | Medium | Versioned provider interfaces, documented fallbacks, no custody by default |
| Canonical repository and standalone code diverge | High | Reconcile SHAs, migrations, feature flags and open PRs before any implementation merge |

## Recommended sequence

Phase 0: Reconcile the canonical repository with later standalone Marketplace/PayCore work by reviewed PRs, **not a blind subtree overwrite**. Verify existing schemas, migration order, CI, security debt and feature flags.

Phase 1: Build the PrestaShop/Zen Cart calibre seller catalogue and evidence admin with synthetic sellers, functional-access filters, product variants, item-type routes, human moderation and participant-led usability tests.

Phase 2: Introduce Adobe Commerce calibre quote, reusable planning lists, purchase authority and organisation contracts; preserve participant grants. All financial instructions remain preparation-only.

Phase 3: Build osCommerce/PrestaShop calibre inventory, fulfilment, repair, rental, returns and operational reporting. Reconcile mock orders, no settlement.

Phase 4: Complete PayCore licensed processor integration, plan-manager export, refunds, accounting/PSP reconciliation, complaints and financial audit under approval gates.

Phase 5: Decide whether to run a controlled real supplier pilot with verified users, sellers, service recovery and independently assured accessibility/security.

## Next actions

1. Product design lead: adopt this document as the working **proposed benchmark** for Marketplace briefs; record what is learned from each exemplar with an exact source.
2. Technical lead: reconcile the canonical codebase with Marketplace #641/#642 and PayCore #643 before migrating modules, then map platform gaps to actual code/PR evidence.
3. Disability-led accessibility lead: validate one supported decision-making purchase journey and one specialist enquiry with disabled participants using representative assistive technologies.
4. Seller operations and compliance owners: define product/supplier evidence review, returns, recalls and accessible human support before accepting live stock.
5. Finance/security owners: keep execution flags off; resolve trusted pricing, replay, webhook, settlement and custody concerns before any payment activation.

**Stop condition:** No merge, production enablement, payment processing, NDIS fundability assertion or third-party code import follows automatically from adopting these benchmarks.

## Official sources (research snapshot)

- Adobe Commerce architecture and transaction ownership: https://experienceleague.adobe.com/en/docs/commerce/information-center/architecture/implementation-architectures
- Adobe Commerce API families: https://experienceleague.adobe.com/en/docs/commerce/information-center/explore-platforms-and-services/commerce-apis
- Adobe Commerce B2B and company approvals: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/introduction
- Adobe Commerce B2B requisition lists: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/requisition-lists/requisition-lists
- PrestaShop 9 developer guide: https://devdocs.prestashop-project.org/9/
- PrestaShop 9 Admin API: https://devdocs.prestashop-project.org/9/admin-api/
- PrestaShop multistore: https://devdocs.prestashop-project.org/9/development/multistore/
- PrestaShop Hummingbird accessibility/theme: https://devdocs.prestashop-project.org/9/themes/hummingbird/
- Zen Cart features: https://docs.zen-cart.com/user/about_us/features/
- Zen Cart modules and plugins: https://docs.zen-cart.com/dev/
- osCommerce product reference: https://www.oscommerce.com/Products

These vendor documents describe capabilities in those products; they are not independent proofs of WCAG conformance or of any specific MapAble implementation.
