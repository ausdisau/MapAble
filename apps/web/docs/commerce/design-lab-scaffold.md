# MapAble Marketplace: research-led commerce UI scaffold

## Objective and current implementation

**Status:** In development, synthetic and nontransactional. Tested behavior is not equivalent to production availability or independent accessibility certification.

**Scope:** An authenticated, feature-gated Next.js/React TypeScript commerce reference design. Nothing creates payment, checkout, supplier contact, quote acceptance, funded claim, real seller approval or storage of a participant's health information.

- Canonical repository: https://github.com/ausdisau/MapAble
- Scaffold branch: feat/commerce-design-lab-20261031
- Research reference: docs/commerce/PLATFORM_REFERENCE_STANDARD.md and docs/commerce/DELIVERY_SCORECARD.md (draft PR #4).
- Older Marketplace and PayCore code: independent draft PRs #641–#643 in ausdisau/mapableau-new; **not reconciled** into the canonical repository.
- Existing default-off guard: apps/web/app/marketplace/(shop)/layout.tsx, enforced by requireAuth and MAPABLE_MARKETPLACE_ENABLED.
- Route: /marketplace/browse/design-lab, **noindex**, under the existing gated shop layout.

## Deep platform comparison and actionable interface decisions

| Exemplar | Evidence from official documentation | Adopted UI pattern | MapAble-specific change |
| --- | --- | --- | --- |
| Adobe Commerce / Magento | B2B negotiable quotes, requisition lists, separate company roles, product types and source inventory | Save to planning list, compare evidence, differentiate product/service types | A supporter or coordinator does not obtain purchase authority by changing perspective; consent and final participant confirmation belong in MapAble Core |
| PrestaShop 9 / Hummingbird | Back-office catalogue forms, product combinations, modular Admin API and multi-shop context; Hummingbird focus restoration/live regions | Accessible native input/filter actions, local seller concept editor, evidence-review queue | No self-verification and no default publishing of high-risk assistive technology |
| Zen Cart | Configurable products, attribute variants, call-for-price, virtual goods, product enable/disable | Different routes for planning, enquiring, assessment, rental and unavailable items | High-consequence goods and reused lifting equipment must not become one-click purchases |
| osCommerce 4 | Product management, stock by variant, supplier identifiers, sales-channel controls | Operational seller queue with product condition and evidence visibility | Product provenance, ownership, recall, repair responsibility and human safeguarding are essential before inventory can be live |

### Sources

1. Adobe Commerce B2B roles, approvals and requisition lists: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/introduction
2. Adobe Commerce quote life cycle: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/quotes/quotes
3. Adobe Commerce product types: https://experienceleague.adobe.com/en/docs/commerce-admin/inventory/basics/product-types
4. PrestaShop 9 Admin API: https://devdocs.prestashop-project.org/9/admin-api/
5. PrestaShop Hummingbird accessibility, focus and live regions: https://devdocs.prestashop-project.org/9/themes/hummingbird/accessibility/
6. PrestaShop multistore: https://devdocs.prestashop-project.org/9/development/multistore/
7. Zen Cart product editing and call-for-price: https://docs.zen-cart.com/user/products/product_edit/
8. Zen Cart attributes and variants: https://docs.zen-cart.com/user/products/attributes/
9. osCommerce admin products: https://www.oscommerce.com/blog/managing-products
10. osCommerce inventory module: https://www.oscommerce.com/app/inventory

Vendor documentation describes vendor features, **not verified MapAble functionality or third-party WCAG certification**. Do not copy third-party assets, templates or proprietary code without licence/security review.

## Scaffold file tree

    apps/web/
      app/marketplace/(shop)/browse/design-lab/page.tsx
      components/marketplace/commerce-design-lab/CommerceDesignLab.tsx
      lib/marketplace/design-lab-model.ts
      tests/commerce-design-lab-model.test.ts
      tests/commerce-design-lab-ui.test.tsx
      docs/commerce/design-lab-scaffold.md
    .github/workflows/commerce-design-lab.yml

The code preserves existing Next.js routes and auth. It adds no Electron desktop packaging, no new CSS runtime, no database migration or PSP dependency.

## Workflow and component boundaries

- **Discover**: search, product-kind, category, functional-access filter, review-needed filter, sorting and cards/list mode. Uses no diagnosis or access to a real participant.
- **Evidence disclosure**: seller identity, condition, compatibility, recalls, tax, funding and warranty show unknown/not assessed unless real independent evidence is later present.
- **Compare**: up to three items in a semantic table, no algorithmically determined suitability, paid rank or independent certification.
- **Planning list**: up to eight local items; 1–5 quantities; nonbinding illustrative subtotal clearly excludes unpriced items and all delivery/GST/funding costs. Local text export only.
- **Seller workspace**: synthetic review queue and previewable seller listing form with validation. No submission, account grants, verification claims or publication.
- **Design references**: official sources for Adobe Commerce, PrestaShop, Zen Cart and osCommerce.
- **Shopper perspectives**: participant, carer/supporter and support coordinator change **guidance text only**, never authorisation or personal data access.
- **Runtime data**: pure TypeScript fixture and deterministic functions; no API, external image or network call from the new client component.

## Accessibility acceptance

Target WCAG 2.2 AA, with **independent manual and participant-led verification still required**.

1. Keyboard and screen-reader navigation across all views; native headings, sections, buttons, labels, status regions and semantic comparison tables.
2. AAC-friendly input, switch access, focus feedback, meaningful labels and non-colour risk cues.
3. 200–400% zoom and reflow without disappearing controls, labels or evidence; large-text option.
4. Reduce cognitive load through cards/list choice and plain-language statuses. No automatic timer or pressure-based purchase flow.
5. Compare, add/remove, invalid-input, empty-results, inaccessible content, failed export and seller review errors have readable recovery paths.
6. No account, diagnosis, NDIS plan, address or other sensitive health field in the design lab. Supporter/coordinator views do not produce delegated authority.
7. Test assistive technologies with disabled participants in addition to automated lint and unit tests.

## Security, consumer protection, funding, consent and failures

- User cannot click through to a new live payment route from this scaffold. It does not import the existing legacy cart/checkout functions.
- Shop layout already requires authentication and enforces the default-off MAPABLE_MARKETPLACE_ENABLED guard. Do not enable the flag in production to demo this page.
- Restricted hoists excluded from planning. Wheelchair, mounting, rental, shower seating and reuse examples remain specialist-enquiry/planning only.
- Seller information is purely synthetic and cannot be used to infer a real Australian business, NDIS registration or warranty.
- Consent and delegate scopes must be enforced by MapAble Core for any future shared real planning/ordering. A dropdown cannot provide legal or operational access.
- Relevant current Australian Consumer Law, TGA/AT safety, NDIA funding and NDIS digital-platform registration requirements must be checked before live listing and checkout.
- Real payable prices, taxes, shipping and funding validation belong to a server-authoritative PayCore/AbilityPay path after the outstanding billing and webhook trust issues are resolved.
- UI state is in React memory only. Reload clears the plan and seller draft; no user/session data is stored.
- If the file download cannot be created, the UI shows a failure message. No webhook, email, seller notification or billing side effect exists.

## Tests and validation

From apps/web after installing locked dependencies:

    pnpm exec vitest run tests/commerce-design-lab-model.test.ts tests/commerce-design-lab-ui.test.tsx
    pnpm type-check
    pnpm exec eslint lib/marketplace/design-lab-model.ts components/marketplace/commerce-design-lab/CommerceDesignLab.tsx "app/marketplace/(shop)/browse/design-lab/page.tsx" tests/commerce-design-lab-model.test.ts tests/commerce-design-lab-ui.test.tsx --max-warnings 0

The dedicated workflow also runs formatting verification. Full repository CI, security review and human accessibility tests still govern release.

## Dependency and integration notes

**Keep:** apps/web/app/marketplace/(shop)/layout.tsx identity and gating, MapAble Core identity/consent, existing catalogue and PayCore source boundaries.

**Add:** model, client UI, route, tests, docs and scoped workflow.

**Update:** gated shop navigation with an explicit "Commerce design lab" link only.

**Wire together:** model -> client component -> authenticated shop page. No server mutation, checkout, provider API, pricing API or mobile bridge yet.

**Next merge order:** first review benchmark PR #4, then this stacked UI draft, then reconcile the newer standalone #641–#643 code and its authorisation/payment security fixes through independent reviewed PRs. Do not merge on the assumption that all source histories are aligned.

## Release decision

**No-go for production commerce.** The only authorised output of this implementation is an internal, synthetic, feature-gated UI scaffold for designer/developer and participant-led usability testing. Production flags, NDIS claims, seller approvals, deployment and Stripe remain unchanged.
