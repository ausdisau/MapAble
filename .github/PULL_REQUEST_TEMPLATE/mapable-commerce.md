# MapAble Commerce Design and Engineering Review

Use this optional template for Marketplace, seller-management, catalogue, rental, service, checkout and PayCore changes. Cite exact source and benchmark evidence. An unchecked item means unresolved, not implicitly passed.

## Participant outcome and exemplar
- [ ] Describe the real participant or seller problem; show the safe recovery path
- [ ] State whether the exemplar is Adobe Commerce, PrestaShop, Zen Cart or osCommerce, and include a current official source
- [ ] Explain what was adopted, adapted or rejected and why; no third-party code copied without separate licence/security approval
- [ ] Link the applicable C01–C16 criteria from docs/commerce/DELIVERY_SCORECARD.md

## Current repo and architecture
- [ ] Record canonical base SHA, source PRs, feature flags and reviewed migration/merge dependencies
- [ ] Identify owners of identity, consent, marketplace catalogue, order, tax, payment and audit state
- [ ] Preserve separate Next.js/React web and Expo/React Native app boundaries
- [ ] No duplicated account, consent, billing or finance truth across Care, Transport, Jobs and Marketplace

## Disability-led design and safety
- [ ] Accessible search/filter is usable without diagnosis disclosure
- [ ] Seller, condition, provenance, verification scope/date and product risks are clearly labelled
- [ ] Specialist equipment cannot bypass assessment, recall, ownership or product-safety gates
- [ ] Supporter or coordinator cannot purchase without verified purpose-limited permission and participant decision safeguards
- [ ] No paid ranking, deceptive urgency, disability-based targeting or hidden fee

## Finance and operations
- [ ] Every quote/order price is derived server-side from versioned trusted records
- [ ] Funding route and NDIS limitations are transparent; no automatic claim or eligibility promise
- [ ] Payment, webhook, refund and payout operations are idempotent, audited and subject to approved PSP reconciliation
- [ ] Cancellation, unavailable item, failed payment, refund, dispute, complaint and human support paths exist
- [ ] Regulated payment and marketplace execution flags remain OFF until separately approved

## Evidence and release decision
- [ ] Unit, integration, authorisation, tenant, replay, race, failure and rollback tests reported
- [ ] WCAG 2.2 AA target assessed through keyboard, screen readers, AAC/switch, zoom/reflow and participant-led tests
- [ ] Manual user/merchant workflows checked against the stated benchmark and the exact code SHA
- [ ] Introduced and pre-existing CI/security failures reported separately
- [ ] Explicit human technical, disability-led, security, consumer/NDIS regulatory and finance approvals recorded before live deployment
- [ ] Go/no-go and operational rollback owner recorded

**Reference:** docs/commerce/PLATFORM_REFERENCE_STANDARD.md and docs/commerce/DELIVERY_SCORECARD.md.

No checkboxes in this template override the requirement for reviewed evidence or explicit production approval.
