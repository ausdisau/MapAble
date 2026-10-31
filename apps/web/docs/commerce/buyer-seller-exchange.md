# MapAble Marketplace — Buyer, Seller, Provider and AT Advisory Exchange

**Date:** 31 October 2026
**Status:** **In development / synthetic-only**, in draft GitHub PR. This document and implementation are **not** evidence of a live marketplace, service provision, regulatory registration, medical-device safety, clinical approval or payment readiness.
**Owner for review:** Australian Disability Ltd product, participant accessibility, supplier assurance, finance and clinical-governance representatives (specific individuals not assigned).
**Route:** /marketplace/design-lab/exchange, using the parent preview's requireAuth and MAPABLE_COMMERCE_DESIGN_LAB_ENABLED default-OFF gate.
**Dependencies:** The canonical MapAble repo, design lab draft #5, commerce research draft #4 and separately maintained Marketplace/PayCore draft PRs in ausdisau/mapableau-new. Do not presume the repositories are synchronised.

## Product decision

Build a disability-led **two-sided exchange with independent advice** instead of a conventional e-commerce site where the seller controls the purchase journey.

- **Buyer side:** people with disabilities (and other buyers) independently browse and specify goals; invite chosen supporters or support coordinators for defined purposes; grant individual vendors time-limited visibility; compare transparent quotes; pause, withdraw, complain or decline without pressure.
- **Seller side:** equipment suppliers and service providers run distinct fulfilment and quotation workflows. A service provider selling an assessment, training or repair is not automatically an equipment supplier, nor authorised to make clinical or financial decisions for a person.
- **Independent advice:** appropriately qualified assistive-technology advisors/assessors may prepare evidence about product risks, alternatives, fitting, trials, training and ongoing maintenance; such advice is distinct from the supplier's commercial quotation and never a substitute for the participant's decision.
- **Support coordinators/carers:** can help prepare questions and manage supplier contact when the participant actually authorises that purpose, but cannot automatically sign orders, disclose health records, change funding or approve products.

**Scope control:** All demo actors, products, providers, prices, credentials, advice and consent grants are fictional. Changing the persona selector inside the demo is not identity or delegation; permissions in the pure TypeScript state machine only illustrate what a trusted server policy must later enforce.

## Evidence ledger: what exists, what does not

| Area | Current status | Evidence and consequence |
| --- | --- | --- |
| Existing synthetic catalogue and storefront | Implemented, not independently verified | MapAble draft #5; 17 fictional product/service/rental/AT/reuse listings; preview separate from default-off commerce |
| Buyer–seller exchange state machine | Implemented in this draft, synthetic only | lib/marketplace/dual-sided/exchange-model.ts; typed state, command/revision checks, quote and limited grants |
| Buyer, supplier, provider, independent advisor and coordinator screens | Implemented in this draft, synthetic only | components/marketplace/dual-sided/ExchangeWorkspace.tsx; in-memory state and no real account data |
| Authenticated preview | In development | Parent app/marketplace/(design-preview)/design-lab/layout.tsx uses requireAuth and MAPABLE_COMMERCE_DESIGN_LAB_ENABLED. Role-switching inside this page is not authenticated RBAC |
| Real actor identity, provider tenant scope, professional registration | Missing / unverified | Must integrate MapAble Core with server-side checks and verified sources before real data |
| Real seller onboarding, stock, clinical assessments, quote issuance | Proposed | Must be reviewed separately against product-safety and legal requirements |
| Escrow, card capture, NDIS claims, AbilityPay reconciliation | **Hard-disabled / not included** | PayCore draft #643 is preparation-only in another repo; no execution interfaces are used |
| Mandatory NDIS digital-platform registration classification | Unresolved for future business operations | Determine if the actual payment-intermediary and business model satisfies new group 0137 before operation |
| Live deployment and user testing | Not verified | No production launch or usability certification claimed |

## Operating concept / screen map

    Public: /marketplace              existing explainer; no live checkout claim
    Preview: /marketplace/design-lab
       ├─ Discover / compare / private planning / seller concept editor
       └─ /exchange
          ├─ Buyer workspace         drafts, consent, quotes, shortlist, decline, close
          ├─ Equipment suppliers     granted AT RFQs, itemised quote, withdrawal
          ├─ Service providers       granted training/repair requests, service quote
          ├─ AT advisors             invited considerations, evidence/trial guidance
          ├─ Support coordinators    invited preparation notes, no buyer authority
          └─ Activity history        synthetic, in-memory redacted event summaries

Core will eventually authenticate and authorise user/organisation membership and claims. This draft's simulated actor picker must never be adapted to real records without replacing it with a trusted, server-issued identity and verified scoped grant policy.

## Target architecture

~~~mermaid
flowchart LR
  P["Participant / Buyer"] --> C["MapAble Core: identity, AAC, consent, delegated scopes"]
  H["Chosen support coordinator"] --> C
  C --> R["Marketplace Request / RFQ"]
  R --> Q["Supplier quotations"]
  R --> S["Service-provider proposals"]
  R --> A["Independent AT advice / assessment evidence"]
  A --> D["Participant review + accessible confirmation"]
  Q --> D
  S --> D
  D --> F["Funding-readiness / high-risk review (human)"]
  F --> O["Source-verified order (future, feature-gated)"]
  O --> B["PayCore / AbilityPay (future, separately approved)"]
  B --> T["Licensed payment partner / plan manager / authorised claim route"]
  O --> E["Delivery / setup / training / repairs / recall / returns"]
~~~

**The diagram is a proposal**. Only the **synthetic request/quote/advisory planning slice** is represented by the current code. There is no real order, external information transfer or PSP action.

## End-to-end human journey and negative paths

1. Participant selects a functional need or offering, enters a plain-language example goal (10–200 characters), with no diagnosis or NDIS ID needed.
2. Request is **private** by default. No seller, clinician or coordinator sees it.
3. The participant may share a limited description with one or more named example suppliers/service providers for a quote, or separately invite an AT advisor for advice or coordinator for support. Grants expire within 90 days in the demo (30-day UI default).
4. Only a supplier for goods/rental/reuse/digital, or service provider for a service, may draft an itemised quote, if their specific grant remains active.
5. Each quote separates item/service, delivery, installation and training, and clearly says GST, supplier status, actual funding and availability are unknown. A quote is **nonbinding**.
6. An independently invited advisor may add planning considerations (a fictional note, **not** a clinical assessment, prescription or credential check). They do not see seller prices by default. Advisors cannot approve or shortlist payment.
7. An invited coordinator can prepare a support note but cannot share information with new sellers or decide for the buyer. Supporters do not automatically acquire substitute decision-making authority.
8. The buyer can shortlist for discussion or decline. **There is no accept-order, contract or purchase action.**
9. The participant can revoke individual grants at any point. After revocation, that actor no longer sees the request in the demonstration and cannot perform a new action. Historical quotes remain visible privately to the participant. Closing a request revokes all grants and blocks new activity.
10. The example audit displays event type, actor and request ID only; it does not repeat personal goals or advisor notes.

**Safe failures:** stale revision is rejected, repeat command ID is idempotent, invalid grant or actor type is rejected, negative/fractional/overflow cents and unpriced direct purchase are blocked, and deleted/expired permissions stop actor operations. There is no real backend or email to fail half-way through.

## NDIS assistive-technology evidence / safety boundary (official guidance checked 31 Oct 2026)

These guidelines are informational and require verification against the item and specific plan; they are **not a rule engine for automatic funding**.

- **Low-cost:** generally below $1,500 per item.
- **Mid-cost:** generally $1,500–$15,000 per item; written evidence/advice may be required and any NDIS purchase depends on actual plan funding and applicable rules.
- **High-cost:** generally more than $15,000 per item; qualified assessor assessment and supplier quote, with approval before an NDIA-funded purchase.
- **Higher-risk:** independent of price. Examples include complex powered mobility, patient transfer/hoist equipment, respiratory devices and some restrictive products. Written advice is needed even when an item is low-cost; specialist professional review and trial considerations belong outside the checkout.
- **Provider restrictions:** NDIA-managed purchase from registered NDIS provider; plan-managed or self-managed may use other suppliers under applicable rules. Supplier quotes do not certify funding.
- Quotes for high-cost equipment should consider costs of delivery, installation and training; participant-directed purchase must not be conflated with NDIA approval, clinical signoff or supplier willingness.

Current NDIS sources:
- https://www.ndis.gov.au/participants/assistive-technology/how-buy-or-rent-assistive-technology/how-buy-mid-cost-or-high-cost-assistive-technology
- https://www.ndis.gov.au/providers/working-participants/assistive-technology-providers/how-prepare-evidence-participants-assistive-technology-assessment
- https://www.ndis.gov.au/participants/assistive-technology/types-assistive-technology/what-higher-risk-assistive-technology
- https://www.ndis.gov.au/participants/assistive-technology/how-buy-or-rent-assistive-technology/how-trial-assistive-technology

**Product implementation gap:** real assessment evidence needs versioned source documents, credential validation, participant-authorised disclosure and clinician review. A typed record or a freeform comment cannot replace those.

## Consent, legal authority and privacy guardrails

### Roles and allowed operations in this prototype

| Role | Read granted request? | Prepare quote? | Prepare advice/note? | Share to new actor? | Shortlist/decline? |
| --- | --- | --- | --- | --- | --- |
| Participant/buyer | Own all | No | Own goal/feedback | Yes, individually | **Yes, nonbinding** |
| Support coordinator | Only with time-limited support grant | No | Administrative preparation | No | No |
| Equipment supplier | Only with time-limited quote grant for product-like offering | **Yes, nonbinding** | No clinical advice | No | No |
| Service provider | Only with time-limited quote grant for service offering | **Yes, nonbinding** | No clinical advice | No | No |
| Independent AT advisor | Only with separate time-limited advice grant | No | Synthetic considerations only | No | No |

Do not conflate speech difference, cognitive access, AAC or reliance on others with incapacity. The participant's own decision and supported communication come first. Real legal guardianship, substitute consent and clinical treatment decisions are external to this prototype and vary by jurisdiction.

**Privacy anti-pattern to avoid:** having a seller see the participant's NDIS number, diagnosis, full clinical assessment, home address, payroll/billing information or other vendor bids merely because a support coordinator entered a referral. Real production systems need purpose-limited grant scopes, expiry, revocation, downstream disclosure records, account/organisation-level authentication, tenant policy and genuine deletion/retention control.

**Conflict of interest:** an advisor may recommend multiple suppliers or no purchase at all; suppliers cannot pay to influence the advice, rankings or evidence. The future platform must disclose when the advisor also has a commercial interest or supplies the item.

## New 2026 registration / consumer protection gates

Under amendments effective 1 July 2026, an in-scope NDIS digital platform whose main purpose is intermediary access to NDIS supports **and which processes NDIS plan-funded payments through that platform** needs registration in support class **0137**. The exact operating model and transition pathway must be independently classified against the rules before real launch; a simple catalogue is not automatically the same service.

- https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration
- https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital

Other approval gates: current Australian Consumer Law (total pricing, refunds, warranties, misleading claims, prohibited unfair pricing), TGA medical-device supply and recall obligations where applicable, supplier insurance, AHPRA/other relevant credential verification, privacy and health-data processing, accessible complaints and returns, and Stripe/PayCore licensing and settlement responsibilities.

## Future durable server contract — **PROPOSED; NOT IMPLEMENTED**

Do not create these APIs without a reviewed auth/tenant ownership model, schema migration, security review and controlled feature flags.

| Endpoint (proposed) | Identity gate | Data scope | Critical validation |
| --- | --- | --- | --- |
| POST /api/marketplace/requests | Authenticated participant or separately verified lawful delegate | Own request; minimal functional preferences | No sensitive defaults, ownership and rate limit |
| POST /api/marketplace/requests/:id/grants | Authenticated participant/verified decision-maker | Scoped named recipient + purpose + expiry | Grant time limits, consent receipt, audit; no default seller broadcast |
| DELETE /api/marketplace/grants/:id | Grant owner/verified decision-maker | Grant revocation + downstream policy | Immediate access cutoff, recheck queued deliveries |
| GET /api/marketplace/requests | Authenticated scoped actor | Server-projected authorised records only | Tenant isolation and object-level auth |
| POST /api/marketplace/requests/:id/quotes | Verified supplier/provider member | Seller-owned proposal and evidence version | Server-calculated item price/taxes, anti-replay, supplier credentials |
| POST /api/marketplace/requests/:id/advice | Verified qualified advisor | Participant-shared, minimal clinical advice | Consent, credential/scope, record integrity and disclosure |
| POST /api/marketplace/requests/:id/shortlist | Authenticated participant | Nonbinding review preference | Never creates order/payment; separate future contract |
| GET /api/marketplace/requests/:id/audit | Participant or authorised reviewer | Purpose-limited audit/history | Evidence integrity, retention and export safeguards |

**Do not** use this demo's client-selected actor ID as a production identity. No persistent DB entities, real API routes, Stripe calls, or server auth mutations are included in this draft. Production record IDs must be unpredictable, tenant-scoped and protected from enumeration and IDOR.

### Proposed persistent data model

MarketplaceRequest, MarketplaceGrant, MarketplaceQuote, QuoteVersion, AdvisorEvidence, TrialPlan, SafetyEvidence, SupplierCompliance, DeliveryObligation, SupportNote, ParticipantReviewDecision, SupplierComplaint and append-only AuditEvent. Reuse MapAble Core User, Organisation, Membership, ConsentReceipt, DelegateGrant, Notification and SupportCase. Reuse only one PayCore financial ledger and order-source contract after legal and architecture review.

### Trust invariants for backend review

1. Request is private by default. Only owner or scoped actors can read a projected view.
2. Quote cannot exist without a current per-recipient share; a vendor cannot see another vendor's quote. Synthetic non-owner request projections also strip the recipient-grant list. A real server must additionally enforce field-level projections before serialisation.
3. Grant revocation propagates immediately to read, notifications, drafts and export authorisation; audit remains participant-readable.
4. Advisor notes are separate from seller quotes and clinical records; no supplier can prescribe for a person solely by listing a product.
5. No automatic participant approval from coordinator, carer, provider, clinician, AI model or role mode switch.
6. All money originates from server-authoritative supplier version/terms or another trusted source, never from client quote fields.
7. An AT recommendation does not certify NDIS fundability, product safety or eligibility.
8. Checkout activation requires separately verified consumer rights, GST, stock, settlement, refunds, payment dispute, digital-platform registration and fraud controls.

## Design exemplars and competitive differentiation

Adobe Commerce: requisition lists, quote revisions and business account control, adapted for participant-directed authority. PrestaShop: accessible merchant catalogue, variants and moderation. Zen Cart: call-for-price, enquiry, hire and restricted-item routing. osCommerce: stock, product condition, supplier administration and multi-channel lifecycle. MapAble adds independent advice, staged evidence collection, explicit support/coordinator boundaries, AT risk and transparent funding uncertainty.

Sources for the exemplars remain in docs/commerce/PLATFORM_REFERENCE_STANDARD.md and docs/commerce/DELIVERY_SCORECARD.md.

## Testing / acceptance and readiness

**Run** from apps/web after locked dependencies and Prisma generation:

    pnpm exec vitest run tests/marketplace-exchange-model.test.ts tests/marketplace-exchange-ui.test.tsx
    pnpm type-check
    ESLINT_CI_LIGHT=1 pnpm exec eslint lib/marketplace/dual-sided/exchange-model.ts components/marketplace/dual-sided/ExchangeWorkspace.tsx "app/marketplace/(design-preview)/design-lab/exchange/page.tsx" tests/marketplace-exchange-model.test.ts tests/marketplace-exchange-ui.test.tsx --max-warnings 0

### Acceptance criteria

- 100% of critical state transitions tested by positive and negative pure-domain tests, including stale revisions, duplicate IDs, expiry, revocation, seller isolation and no cross-role purchase.
- Accessible workflow manual QA with keyboard, screen readers, switch input, AAC, voice input, 200–400% zoom, reduced motion and interruptions; maintain a severity-ranked defect register. Automated tests do not independently certify WCAG 2.2 AA.
- Participant-led tests for the difference between quote shortlisting and binding acceptance, realistic cost breakdowns, no forced family disclosure, revocation consequences and meaningful human help.
- Seller/AT reviewer tests for conflict of interest, incorrect supplier type, assessor credential mismatch, underquoted training/installation and clinical safety escalation.
- Product security tests for object-level auth, grant expiry, tenant separation, rate limits, document scanning, signed audit, retention/deletion and no leaked health records before production APIs.
- Legal/governance review for NDIS registration class 0137 if in scope, ACL, TGA, privacy, insurance and commercial/payment duties before live money.

## Risks and release vetoes

| Risk | Severity | Mitigation and release veto |
| --- | --- | --- |
| UI role picker mistaken for authorisation | Critical | Synthetic-only demo; forbid real data/API until server-bound identity/ABAC |
| Prescriber becomes a vendor endorsement or substitute decision-maker | Critical | Independent clinical governance, conflict transparency, participant confirmation |
| Higher-risk item pushed into checkout | Critical | Risk rules independent of cost; assessment and safety evidence; human review |
| Supplier quote interpreted as invoice, NDIS approval or paid order | Critical | Nonbinding labels, separate future PayCore settlement review |
| Seller sees another supplier's bid or clinical data | Critical | Server projections, grant revocation/expiry, tenant and access tests |
| Registration, ACCC/ACL and TGA uncertainty | Critical | Current official source verification and legal/supplier assurance gate |
| Inaccessible disclosure, consent or quote comparison | High | Participant-led WCAG 2.2 AA testing and human assistance fallback |
| Canonical repository diverges from later standalone work | High | SHA-based reconciliation; never blindly merge old billing code |

## Next implementation order

1. Product/accessibility leads: conduct participant, seller and independent AT advisor walkthroughs against this synthetic journey; record what is confusing, particularly funding, advisory authority and grant withdrawal.
2. Engineering/identity lead: reconcile Marketplace #641/#642 and PayCore #643 with the canonical repository, then design server-side tenancy, scopes, consent receipts and quote versioning. No blind merge.
3. Supplier assurance and clinical governance: document qualifying advisor/assessor evidence, independent review, quote completeness, trial/installation requirements, item recalls and professional conflicts.
4. Finance/legal: document business role (merchant of record, intermediary, referral platform), NDIS digital-platform registration classification, payment custody and ability to issue claims, then approve a narrow sandbox-only PSP adapter when ready.
5. Accessibility/support: design accessible human contact, complaint and dispute pathways before pilot supplier onboarding.

**Go/no-go:** NO-GO for real marketplace trading, live clinical data, NDIS claims, payments, production enablement or release. Draft PR remains unmerged until code CI, manual disability-led usability, privacy/security/legal and explicit owner sign-off.
