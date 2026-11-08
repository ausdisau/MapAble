# MapAble Marketplace — canonical closed-alpha integration

**Decision**: code review only, no production enablement.
**Canonical SoR**: `ausdisau/MapAble` (`apps/web` and `apps/mobile` remain independently installed).
**Source lineage**: `ausdisau/mapableau-new` draft PRs [#641](https://github.com/ausdisau/mapableau-new/pull/641), [#642](https://github.com/ausdisau/mapableau-new/pull/642), [#644](https://github.com/ausdisau/mapableau-new/pull/644). PayCore [#643](https://github.com/ausdisau/mapableau-new/pull/643) is **not merged or integrated**.
**Separate workflow**: independent of [Unified Workspace Router PR #9](https://github.com/ausdisau/MapAble/pull/9); no `/workspace` files changed.

## Scope and exact paths

- `apps/web/app/marketplace/alpha` — authenticated and alpha-allowlisted participant-facing synthetic catalogue, comparative discovery, and separate supplier-to-refund simulation views. These use the existing Core session, **not** simulated role selectors for authorization.
- `apps/web/app/api/marketplace/alpha-estimate/route.ts` — authenticated, same-origin, allowlisted, non-persistent price *preview* based exclusively on trusted synthetic listing IDs and quantities. Returns `checkoutAvailable: false`.
- `apps/web/packages/marketplace-inclusive/src` — portable, dependency-free synthetic pilot catalogue, closed-alpha fixtures, open-beta source policy and deterministic role/consent/ledger simulator.
- `apps/web/components/marketplace` — reused UI screens. Existing legacy cart UI intentionally disabled.
- `apps/mobile/src/marketplace/MarketplaceAlphaScreen.tsx` — **unmounted native source**; available for gated evaluation only after actual server-side mobile authorization exists.
- `apps/web/app/api/billing/invoices/route.ts` — narrow fail-closed rejection of old client-priced Marketplace invoice submissions. Existing non-Marketplace invoice behavior otherwise unchanged.

## Flags and authentication

Both flags default **OFF** in the canonical repository:

```text
MAPABLE_MARKETPLACE_ENABLED=false
MAPABLE_MARKETPLACE_ALPHA_ENABLED=false
MAPABLE_MARKETPLACE_ALPHA_TESTER_IDS=
```

For a controlled internal **preview only**, an authorised release owner may enable `MAPABLE_MARKETPLACE_ALPHA_ENABLED=true` and populate `MAPABLE_MARKETPLACE_ALPHA_TESTER_IDS` with approved, authenticated user IDs. `mapable_admin` is admitted when the alpha flag is on. A display-only role selector in the synthetic operations lab does not create consent or delegation authority. Keep `MAPABLE_MARKETPLACE_ENABLED=false`: that is the separate legacy transactional shop switch.

## Rights, consent and safety

- No diagnosis, NDIS number, bank, health, GPS or identity form inputs in the Marketplace demonstration. Do not enter such values in synthetic drafts.
- Different participant, supporter and coordinator *views* are not permission grants; the simulated grant/revoke transitions are educational and **not Core DelegationGrant**.
- Simulated supplier verification, recall checks, GST/shipping, stock reservation, dispatch, ledger and refunds do not certify real-world compliance. No merchant agreements or enforcement decisions.
- Restricted equipment cannot enter example baskets. Specialist-review items cannot automatically become purchases or safety recommendations.
- Participants retain confirm/cancel control inside the fictional workflow; no real-world decision rights or claims are inferred from it.
- No live Stripe, Checkout, Connect, payouts, returns, claims, invoices, real procurement, external supplier feeds or database migrations are invoked by the alpha views.
- Independent safety, ACL, NDIS/platform, TGA/product, tax, privacy and financial reviews remain required before any open-beta commercial pilot.

## Open-beta connector readiness (not activation)

The portable `canIngestExternal` predicate requires stage `open-beta`, an explicit enabled switch, approved source, and human review. No connector exists or runs. Future integration requires server-held credentials, source licence and provenance, revision/refresh timestamps, ABN and seller identity verification, product safety/recall/insurance and fulfilment evidence, moderation/takedown, tenancy and consent checks. Public Wikidata CC0 can supply *taxonomy*, never seller verification, price, safety or inventory by implication.

## Release and verification gates

1. Verify the source branch/commit and compare exact-head CI with the canonical main baseline.
2. Run targeted domain, interaction and guard tests; web type-check, eslint, build, mobile type-check. Do not treat a passing scoped test as a production release.
3. Confirm API rejects missing flag, unauthorised user, invalid quantity, unexpected price fields, cross-origin JSON, restricted equipment and oversized requests; confirm no call to actual billing/Stripe route.
4. Conduct disability-led WCAG 2.2 AA review: keyboard, screen readers, AAC/switch, 44px touch targets, 200–400% zoom/reflow, interrupted-state recovery, meaningful labels/errors and human assistance.
5. Remediate the legacy webhook failure/replay and Stripe livemode mismatch described by PayCore draft #643 before **any** payment execution consideration. Confirm independent legal, finance, safety, privacy and participant reviewers.
6. Explicit human release approval and reproducible synthetic preview deployment. Production rollout: **NO-GO** until all relevant gates are evidenced.

### Rollback

Turn off `MAPABLE_MARKETPLACE_ALPHA_ENABLED` to return 404 on the alpha route and API. No persistence or migrations introduced. Revert the draft commit if necessary; do not reverse the hardening of legacy Marketplace invoice protection without review.

### Evidence and caveats

- Original source imported from unmerged legacy draft PRs, not claims of production implementation.
- Canonical base `main` SHA: `b51cb9b73395769c46c3f64dd6094120bc2cedac`.
- User/source suitability and WCAG conformance have **not** been independently validated.
- Owners to assign: product/participant lead, security, finance/PayCore, legal/ACL, supplier safety, accessibility and DevOps. Dates not yet confirmed.
