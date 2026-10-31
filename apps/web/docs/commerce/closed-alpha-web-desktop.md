# MapAble Marketplace — Web and Desktop Closed Alpha

**Current state (31 October 2026):** IN DEVELOPMENT, synthetic only, not deployed, signed, independent-accessibility-tested, or production-ready. This design is NOT evidence of provider registration, clinical qualification, payment authorisation or NDIS funding eligibility.

**Decision:** Reuse MapAble's Next.js 15 / React / TypeScript app for a closed alpha in browsers, and wrap the same authenticated route in a minimal Electron 45 desktop shell. Provide a separately gated external-source contract for a future read-only open beta, with no real ingestion or checkout enabled in this PR.

## Evidence and provenance

| Area | State | Primary implementation |
| --- | --- | --- |
| Eight synthetic assistive-technology and service catalogue examples | Implemented in code, not independently verified | apps/mobile/src/runtime/marketplaceAlpha.ts, and mirrored names/prices in apps/web/lib/marketplace/alpha/web-alpha-model.ts |
| Buyer-seller, provider, coordinator and independent AT advisor simulation | Implemented in draft #6 | apps/web/lib/marketplace/dual-sided/exchange-model.ts |
| Web closed-alpha search, filter, compare, shortlist and research checklist | Implemented in this draft, not independently QA-verified | apps/web/components/marketplace/alpha/MarketplaceAlphaWeb.tsx |
| Auth and closed tester allowlist | Implemented in code | apps/web/app/marketplace/(design-preview)/design-lab/closed-alpha/layout.tsx |
| Desktop shell | Scaffolded, un-packaged | apps/marketplace-desktop/src/main.ts, origin-policy.ts |
| Real payment, external records, provider approval, Stripe and PayCore | NOT IMPLEMENTED/NOT ACTIVATED | No mutations to financial services or real supplier records |
| Read-only open-beta transition | Designed and implemented as a fail-closed source contract | apps/web/lib/marketplace/alpha/open-beta-source-contract.ts |
| Manual WCAG 2.2 AA/assistive tech and pilot acceptance | NOT VERIFIED | Must be completed by testers before release |

## Current routes and integration

Keep the existing public Marketplace explainer, previous gated design lab and nonbinding buyer-seller Exchange. Add an internal Next.js research page at:

    /marketplace/design-lab/closed-alpha

Its parent layout already requires a real authenticated user and MAPABLE_COMMERCE_DESIGN_LAB_ENABLED=true. The child layout independently requires MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED=true and an **exact match** for the authenticated user's server-side ID in MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS. No wildcard, automatic admin bypass or email substring is allowed. Vercel production is denied.

**Keep MAPABLE_MARKETPLACE_ENABLED=false**. This is the existing shop/checkout flag and does not need enabling to run research.

The browser and desktop render one shared Next.js interface. Electron holds no extra truth, and has no local participant data store, payment functionality, API keys, privileged renderer IPC or supplier search.

## Local development (PowerShell)

Start a test Next.js server with MapAble Core auth already configured:

    cd apps/web
    $env:MAPABLE_COMMERCE_DESIGN_LAB_ENABLED="true"
    $env:MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED="true"
    $env:MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS="<existing-test-user-id>"
    $env:MAPABLE_MARKETPLACE_ENABLED="false"
    pnpm dev -- -H 127.0.0.1

Sign in with the allowlisted account, then open:

    http://127.0.0.1:3000/marketplace/design-lab/closed-alpha

The browser research page does not ask for diagnoses, NDIS numbers, health data or payment credentials. All planning and study checkboxes remain in browser memory; general feedback can be downloaded locally as plain text. No results are automatically sent.

To start the optional **desktop development shell**, with Next.js still running:

    cd apps/marketplace-desktop
    npm install
    npm run typecheck
    npm run build
    $env:MAPABLE_DESKTOP_ALPHA_ORIGIN="http://127.0.0.1:3000"
    npm run dev

The desktop shell is an Electron/TypeScript wrapper, **not a separately installed Next.js server**. It denies untrusted origins and new windows, runs a sandboxed/context-isolated renderer with Node integration disabled, and has no preload or IPC bridge. Third-party OAuth redirects and remote fonts/media will not work by default; use the browser version until those security and sign-in cases are specifically reviewed. No binary signing, installer, code notarisation or release is claimed.

Official Electron guidance: https://www.electronjs.org/docs/latest/tutorial/security

## Open beta: progression to external, source-backed evidence

The closed alpha remains exactly eight fictional entries based on the general categories of the WHO Priority Assistive Products List. It is **not** a WHO product database, verified retailer inventory or NDIS price catalogue.

**Source candidates — NOT CONNECTED:**

| Candidate | Appropriate use | Limitation |
| --- | --- | --- |
| NDIS Commission Provider Register | Dated public provider-registration information | Registration status can change and does not establish quality, clinical fit or MapAble supplier approval; licence and data rights need review |
| NDIA open market data | Aggregated regional/provider-market research | It does not provide individual sale offers, inventory or item prices |
| OpenStreetMap | Community-reported access-place information | ODbL attribution/share-alike applies; access data may be incomplete or outdated and API capacity is constrained |
| Opt-in supplier product feeds | Potential future item catalogue with supplier consent/licence | Requires seller onboarding, stock, legal terms, tax, recall and equipment-risk review before publication or sale |

**Primary sources:**
- https://www.ndiscommission.gov.au/provider-registration/find-registered-provider
- https://ndis.gov.au/participants/working-providers/finding-providers/provider-finder
- https://dataresearch.ndis.gov.au/explore-data
- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Attribution_Guidelines
- https://wiki.openstreetmap.org/wiki/Overpass_API
- https://www.who.int/publications/i/item/priority-assistive-products-list

### Hard release gates

The read-only open-beta path requires all flags to be set to the literal value true **by the server**:

    MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED
    MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED
    MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED
    MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED
    MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED
    MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED

All default OFF. The open-beta API is already reserved at:

    GET /api/marketplace/open-beta/catalogue

It answers 404 when disabled. It answers 503 with an empty record list when review flags are ON but no reviewed external adapters/records exist. **No adapters are connected and no external data is fetched by this branch.**

The data contract enforces a source-record identifier, exact HTTPS host, explicit rights decision, human reviewer, individual record review, recorded retrieval/review date and an agreed freshness window (1–30 days). Wrong data type, stale/future data, missing licence decision, revoked publication, unknown host or incomplete provenance fails closed.

Passing these data gates produces ONLY a source-dated, read-only item with null price, false verifiedSupplier and false canPurchase. **A public provider-register or OSM record never becomes a product, verified seller or payment instruction by import alone.**

### Later source-ingestion implementation (proposed, not yet running)

1. Data steward and legal lead approve each source's licence, attribution, data fields, permitted use and retention.
2. Engineering provisions allowlisted, fixed-URL server adapters with bounded downloads/timeouts, caching, rate limiting and no URL supplied by the client. For large OSM datasets use an approved extract or contracted data provider rather than public API overload.
3. Store raw candidate snapshots separately from the published catalogue with source revision, retrieve time, content digest and provenance chain. Apply schema checks, redaction, deduplication, anti-injection and licensing checks.
4. Human reviewer approves each proposed public record and attribution. Provide accessible correction/report-issue, takedown, revocation and stale-data warnings.
5. Publish a limited read-only beta canary with audit, rollback, consent, accessibility and moderation evidence.
6. Only a later, independent commercial workstream can validate individual sellers, clinical product safety, NDIS rules and server-authoritative PayCore prices before any real buying or payment.

This handoff establishes a route/contract for future source adapters, **not an actual external-data integration or production beta launch**.

## Rights, privacy and reliability

- Participants retain primary decision ownership, including AAC and supported communication.
- Supporter/coordinator modes do not confer legal delegation; the existing dual-sided role-switching lab is fictional and cannot be used with real records.
- Require assistive technology review for safety-critical items independently of price; a supplier listing is not a prescriber recommendation.
- Default to no data collection beyond authentication needed for the private pilot.
- Do not rank by paid supplier status, disability assumptions, NDIS plan amounts or privileged client data.
- Provide a plain-language, accessible complaint, report-a-problem, withdrawal and human help pathway before opening the beta.
- Security review must cover identity/tenant isolation, source-feed licensing and security, legal classification of NDIS digital platforms, consumer law, TGA, payment custody, complaints and breach response.

## Verification and ownership

**Code and security checks:** The dedicated workflow runs locked web dependency install, Prisma generation, Next.js TypeScript, Vitest component/domain regression tests, focused ESLint, plus Electron TS compile and explicit origin-policy tests. Global code security scanning remains separate. Passing these checks is not WCAG/clinical/regulatory approval.

**Manual acceptance required:** WCAG 2.2 AA, NVDA/JAWS, keyboard/switch, speech/AAC, VoiceOver/TalkBack, 200–400% zoom/reflow, colour contrast, low-bandwidth/error handling and participant-led usability; Windows/macOS packaging and signing; SSO/desktop OAuth, CSP and safe navigation.

**Roles to assign:** Product/accessibility owner, MapAble Core identity owner, data steward and licensing reviewer, security/desktop owner, independent AT/clinical advisor, finance/PayCore reviewer. Named owners/deadlines not yet confirmed.

**Go/no-go:** NO-GO for public/open beta, real external ingestion, production deployment, signed desktop binaries, supplier orders, PaymentIntents, Stripe test/live charges or NDIS claims. Preserve default-off gates and keep this PR draft and unmerged pending review.
