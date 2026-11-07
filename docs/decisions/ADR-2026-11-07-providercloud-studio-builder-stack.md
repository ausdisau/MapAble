# ADR-2026-11-07 — ProviderCloud Studio: website-builder and optimisation stack

- **Decision status:** Accepted as product/architecture direction; implementation and release gated
- **Decision date:** 7 November 2026 (Australia/Sydney)
- **Decision owner:** Australian Disability Ltd — product governance
- **Scope:** ProviderCloud Studio, a proposed website-design, hosting, SEO/GEO/SMO, plugins and templates marketplace
- **Record type:** Architecture Decision Record (ADR); documentation only
- **Related context:** ProviderCloud Studio offline marketplace prototype v0.1; previous investigation of BuildingOpen, Soloist AI, Vercel, Synergy Wholesale, TPP Wholesale, cPanel and Plesk
- **Live-state caveat:** This ADR authorises *a design direction*, not a deployed integration, partnership, domain registration, customer charge, or production rollout.

## Decision

1. **Adopt BuildingOpen OpenPage as the first-choice foundation for an editable, JSON-first website-building studio.** Evaluate a bounded integration in a separate sandbox before importing third-party code or introducing a new dependency root. Preserve portable site documents, deterministic previews, diffable version history and exportability.
2. **Offer BuildingOpen OpenGTM-inspired GEO/AEO/SEO tooling as an optional, consent-controlled optimisation service.** Human-review outputs and evidence provenance. Paid tiers (one-off audits and subscriptions) are commercial proposals pending costs, legal review and product approval. Do not guarantee visibility, ranking or traffic results.
3. **Keep Soloist AI as an alternative under technical and licensing evaluation, not a simultaneously integrated second page editor.** Revisit only if OpenPage fails documented accessibility, extensibility, maintainability or security tests.
4. **Evaluate OpenBrowser as optional internal QA infrastructure, not a customer-account automation entitlement.** Use ephemeral test identities, scoped credentials, explicit permission and retention limits. Do not copy personal browser profiles or grant unattended access to third-party accounts.
5. **Retain separate hosting and registration boundaries:** Vercel for eligible static/modern web deployments (subject to commercial/partner authority); Synergy Wholesale and TPP Wholesale as distinct proposed domain/hosting reseller adapters; cPanel/Plesk only through authorised server-side integration. No live provisioning, billing or DNS modification by virtue of this ADR.
6. **Keep marketplace purchase and operational states honest.** Prototype checkout, plan pricing, supplier routing, integration health and site publication must state `PROPOSED`, `DEMO_ONLY`, `PENDING_APPROVAL` or equivalent until independently verified. Never treat client-side policy checks as server authority.

## Architectural boundary: avoid name collision

The canonical `ausdisau/MapAble` repository already uses **ProviderCloud** for provider/workforce service modules (for example, `apps/web/lib/config/provider-workforce.ts`). **ProviderCloud Studio** in this ADR means a *separate website-services marketplace concept*, not those health, disability, worker-matching or NDIS services.

- Do not connect Studio customer identities, site documents, agency billing or wholesale supplier permissions to MapAble Care or workforce data by default.
- Do not reuse health or participant data for site-generation or marketing services.
- Before implementation, resolve whether Studio belongs in its **own repository and tenant boundary**, rather than adding runtime code to the canonical MapAble product. Recording this ADR here is not the approval to merge services.
- Any future shared AD.iD/MapAble Core integration requires an independent privacy, data-model, security and consent decision.

## Reasons and alternatives

**OpenPage — selected architecture target:** inspected README describes a React/TypeScript visual editor with JSON-defined blocks, templates, themes, preview and standalone HTML export; the repository's MIT licence permits commercial modification/distribution subject to preservation of the notice. Source: https://github.com/buildingopen/openpage and https://github.com/buildingopen/openpage/blob/master/LICENSE . Verify dependency and asset licences separately; no formal vendor relationship is implied.

**OpenGTM — optional research/service component:** inspected README describes AEO checks, keyword research and content workflows, implemented as a Python CLI using external Gemini/Google dependencies. Its MIT licence was checked; this is **not** evidence of reliable ranking, exhaustive AI visibility, free model usage or an accessible client-facing implementation. Source: https://github.com/buildingopen/opengtm and https://github.com/buildingopen/opengtm/blob/main/LICENSE .

**OpenBrowser — internal QA candidate:** inspected project describes Chrome-profile leasing, remote browser APIs and audited session tooling. It requires a separate operational/security review before use. Source: https://github.com/buildingopen/openbrowser and https://github.com/buildingopen/openbrowser/blob/main/LICENSE .

**Soloist AI — deferred:** https://github.com/soloist-ai/soloist-ai . No assertion of compatibility, licensing or integration readiness is made here.

**Alternative approaches not chosen now:** building a bespoke JSON editor from scratch (greater maintenance burden); enabling two competing site editors simultaneously (fragmented document model); connecting generative AI or wholesale provider APIs directly from browsers (unsafe credential/authority boundary); promising automatic WCAG/SEO certification (unsupported).

## Proposed first implementation slice — separate review and approval

1. Create a small contract package, `SiteDocument` v0.1, with documented schema version, allowed block types, accessibility text alternatives, focus/reading-order semantics, provenance and migration rules. Use **synthetic content** only.
2. Build a proof-of-concept adapter: marketplace template `->` validated `SiteDocument` `->` sandbox OpenPage-compatible editor `->` static preview/export. Disallow arbitrary executable embeds and external requests by default.
3. Define website build and customer approval states: `DRAFT`, `REVIEW_PENDING`, `APPROVED_FOR_STAGING`, `PUBLISHED`, `ROLLBACK_REQUIRED`; initial work stops before `PUBLISHED`.
4. Define an optional optimisation audit contract: requested URL/scope, source timestamp, check/evidence, confidence and limitations, suggested revisions, customer consent and deletion. No SEO/GEO performance claims before repeatable measured evidence.
5. Keep external provider adapters **OFF** by default. Design but do not activate order and subscription ledgers; server re-prices purchase quotes; payment webhook idempotency and tenant permissions must be tested before charges.
6. Collect required licence notices and review third-party package provenance, dependency advisories, accessibility and security before any import, deployment or paid redistribution.

## Acceptance gates

- **Accessibility (pending):** disability-led keyboard, screen-reader, AAC/switch, focus restoration, 200–400% zoom/reflow, reduced motion and error-recovery studies, against WCAG 2.2 AA; automated tests alone are insufficient.
- **Security (pending):** tenant isolation, independent server authorisation, least-privilege service accounts, content sanitisation, sandboxed preview, CSP, supply-chain review, logged administrative actions, SSRF protections and auditability.
- **Privacy/consumer law (pending):** explicit purpose/retention/deletion, no hidden AI data transfer, clear recurring fees and cancellation terms, Australian Consumer Law review, valid terms/receipts/tax handling, provider agreements.
- **Supplier authority (pending):** written Vercel partner/reseller terms as applicable and approved Synergy/TPP/cPanel/Plesk contracts and credentials; registration/provisioning requires separately authorised human-reviewed actions.
- **Product validation (pending):** customer usability and design quality, repeatable audit accuracy, pricing economics and support operations verified with evidence.
- **Engineering/release (pending):** dedicated implementation PR, CI for schemas/tests, protected Vercel preview tied to an exact commit SHA, human release approval and rollback rehearsal.

## Consequences and follow-up

**Benefits:** reusable site-template formats, optional recurring optimisation revenue, modular infrastructure choice, disability-led usability controls and a transparent migration route.

**Risks:** third-party library churn; paid AI/data-transfer costs; external dependency licences; disjointed customer identity; broad claims about optimisation; auto-publish or credential abuse; confusion with existing MapAble ProviderCloud workforce features.

**Next decision:** choose a separate Studio repository and tenant/identity boundary, then review the first synthetic `SiteDocument` prototype and licence/SBOM results. No runtime code, supplier integration, production DNS, Vercel deployment or Stripe billing is approved by this record alone.

## Source provenance

- BuildingOpen repository directory: https://github.com/orgs/buildingopen/repositories
- OpenPage repository and MIT licence: https://github.com/buildingopen/openpage
- OpenGTM repository and MIT licence: https://github.com/buildingopen/opengtm
- OpenBrowser repository and MIT licence: https://github.com/buildingopen/openbrowser
- Soloist AI project (evaluation only): https://github.com/soloist-ai/soloist-ai
- Vercel partner programme: https://vercel.com/partners#become-a-partner
- Synergy Wholesale reseller integration: https://synergywholesale.com/integrations/api-integration/
- TPP Wholesale supplier: https://www.tppwholesale.com.au/

These are pointers to independently owned projects and proposals, not approval or live integration evidence.
