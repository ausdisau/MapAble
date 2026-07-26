# MapAble ANZ Business Plan vs Repo — Gap Analysis

**Status:** strategy documentation — not a production readiness claim  
**Source document:** *MapAble Business Plans for Australia & New Zealand* (uploaded analysis baseline, 2026-07)  
**Repo contrast:** [COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md), [cursor-five-year-masterplan.md](../mapable/cursor-five-year-masterplan.md), [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md)  
**Public claim gate:** [PUBLIC_CLAIM_REGISTRY.md](../convergence-os/PUBLIC_CLAIM_REGISTRY.md), informational GO routes in `lib/public/informational/routes.ts`

This note captures a durable gap matrix between the ANZ business plan’s three pillars and what the codebase ships today. It does **not** authorise marketplace commissions, public booking claims, NZ funding integration, or GTFS production status.

---

## Document pillars

| # | Business-plan pillar | Intent |
|---|----------------------|--------|
| 1 | **MapAble for Care** | Two-sided care marketplace (Mable/Hireup-like): map of providers + accessibility, matching, bookings, reviews, freemium + ~10%/5–8% commissions, NDIS/Whaikaha alignment, ANZ pilot |
| 2 | **MapAble for Transport** | Free accessible journey planning (filters, station facilities, tips); premium “Personal Transit Assistant”; B2B/white-label with transit agencies; Total Mobility (NZ); ads for accessible services |
| 3 | **MapAble Marketplace** | Broad disability services + **products** marketplace (equipment, home mods, professional services, activities) beyond Care/Transport; commissions, premium listings, ads, data insights; category expansion later includes **jobs/housing** |

**Not a dedicated pillar in the business plan:** Employment/Jobs. The repo’s `/employment` + auth Jobs module is orthogonal; the plan only mentions jobs as a future Marketplace category.

---

## Strategic conflict (must resolve before marketplace builds)

```text
ANZ Business Plan  →  freemium marketplace + commissions
Repo strategy      →  journey + evidence + facilitation (not another marketplace)
Current product    →  controlled pilots + GO-gated public explainers
```

- The business plan positions Care (and Marketplace) as **transactional marketplaces** competing with Mable/Hireup, with commission monetization.
- Repo strategy says MapAble is **not** another support-worker marketplace; defensibility is consent, continuity, evidence, and human-gated ops ([COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md)).
- Public surfaces under-claim on purpose: `/care`, `/transport`, `/employment` are programme explainers — live booking is not marketed via informational GO CTAs.

**Default until north star is decided:** treat the business plan as aspirational market research; keep claim/strategy gates; only productise plan features that do not violate GO-gate / “not another marketplace.”

---

## OWNER_ACTION_REQUIRED — Product north star

**Status:** `AWAITING_LEADERSHIP`  
**Blocks:** freemium listing tiers, pay-to-rank or premium placement, transaction commissions marketed as a marketplace SKU, Hireup/Mable-clone booking UX on public surfaces, MapAble Marketplace commerce vertical.

Leadership must choose **one** of the following before commission/listing work proceeds:

| Option | Meaning | Consequence |
|--------|---------|-------------|
| **A — Keep orchestration strategy** | Repo [COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md) and masterplan remain SoT; business plan is research input only | Continue pilots, Access Map, evidence/billing, honest public copy; **do not** implement marketplace commissions or national worker-marketplace launch (see [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md)) |
| **B — Align product to marketplace plan** | Explicitly revise competitive position + claim registry to allow freemium marketplace + commissions | Requires new PRDs, GO-gate changes, consumer-law/NDIS intermediary review, and public claim updates **before** any shipping work |

Until Option A or B is recorded here (date + decision owner), engineering must **not** silently implement plan monetization against current claim gates.

**Decision log**

| Date | Decision | Owner | Notes |
|------|----------|-------|-------|
| — | *Pending* | — | Fill when leadership decides A or B |

---

## Pillar 1 — Care

| Plan capability | Repo status | Evidence |
|-----------------|-------------|----------|
| Public care brand / explainer | **Built** | `app/care/page.tsx` |
| Provider discovery / map | **Partial** | Provider Finder + NDIS outlets; not liquid marketplace availability |
| Bookable care loop | **Partial** (pilot, not public) | Auth Care request → assign → shifts → logs → billing (`docs/modules/care.md`); GO gate blocks marketing CTAs to `/care/request` |
| Accessibility mapping of venues/providers | **Partial** (adjacent product) | `app/accessibility-map/` + ADL places dataset; Care–Transport map surfaces |
| Worker/provider reviews after booking | **Missing** | Venue/place reviews exist; Hireup-style care reviews do not |
| Freemium + transaction commissions | **Missing** as product; fee plumbing only | Pricing under review; no listing tiers |
| NDIS payment / claim integration | **Partial** | Billing handoff; NDIA submit mock/hard-off |
| Whaikaha / NZ care funding | **Missing** | AU/NDIS-first; no NZ locale/funding path |
| AI auto-match | **Missing** (by design) | Pilot excludes unreviewed auto-assign |

**Verdict:** Closest real product is **controlled-pilot care ops + discovery**, not the plan’s open freemium marketplace.

---

## Pillar 2 — Transport

| Plan capability | Repo status | Evidence |
|-----------------|-------------|----------|
| Public Transport landing + honesty labels | **Built** | `app/transport/page.tsx`, `lib/transport/feature-status.ts`, `lib/transport/public-copy.ts` |
| Free accessible GTFS-style journey planner | **Marketing-only / demo** | `app/journey-planner/` — placeholder modes/ETAs, not live transit |
| Station facilities / lift alerts / crowd tips | **Missing** (alerts); map places **Partial** | Accessibility map has parking/places; no GTFS-RT lift feed |
| Premium Personal Transit Assistant | **Missing** as paid SKU | Copilot/Ask surfaces exist elsewhere; not a Transport freemium product |
| B2B / white-label for transit agencies | **Missing** | GTFS adapter = future/unchecked in transport PRD |
| Total Mobility (NZ) | **Missing** | Zero repo references |
| Accessible trip booking with providers | **Partial** (pilot) | Trip/quote/assign ops; live tracking & booking bridge flags off |
| Disability parking | **Partial** | ADL `Mobility_parking` on Access Map; not a rights/booking product |

**Verdict:** Repo Transport is an **NDIS-adjacent trip/dispatch pilot** with honest public copy; the plan’s **consumer accessible-transit freemium** is largely unbuilt.

---

## Pillar 3 — MapAble Marketplace

| Plan capability | Repo status | Evidence |
|-----------------|-------------|----------|
| Multi-category services + products marketplace | **Missing** / deferred | Feature freeze / remediation ban speculative marketplace verticals; legacy `/marketplace` references are not a live ANZ commerce product |
| Product listings (AT, equipment) | **Scaffold at most** | AT lifecycle / marketplace taxonomy hints — not a shop |
| Premium provider listings + ads | **Missing** | — |
| Commission on services/products | **Missing** | — |
| Community reviews of services/products | **Missing** (except place reviews) | — |
| Jobs/housing as category expansion | Jobs **Partial** (auth alpha, not Marketplace); housing **Missing** | `docs/modules/jobs.md`; public `/employment` explainer only |

**Verdict:** Largest gap. Plan’s Marketplace is essentially a **fourth product** the repo has consciously deferred.

---

## Cross-cutting ANZ readiness

| Theme | Status |
|-------|--------|
| AU locale (`en-AU`, AUD, Sydney TZ) | **Built** |
| NZ locale / NZD / Whaikaha / Total Mobility / Enable NZ | **Missing** |
| WCAG / accessible UI intent | **Partial** (platform standards; continuous work) |
| Production public claims for transactional Care/Transport | **Blocked** by GO gate + claim registry |
| Controlled pilot charter (NSW-scale Care+Transport) | **Documented**; human gates incomplete |

---

## What the repo matches well

1. **Accessibility mapping** as a Care USP differentiator — Access Map + ADL import is real public value.
2. **ANZ disability / NDIS framing** on Care and Transport landings (AU-first).
3. **Pilot-first sequencing** — plan calls for locale pilots; repo has controlled-pilot charter and honesty labels.
4. **Partner / institutional monetization lean for Transport** — closer to B2B than consumer commissions; still unimplemented.

---

## Deferred low-conflict backlog (after north star)

**Status:** `BLOCKED_ON_NORTH_STAR` — do not start until the decision log above records Option A or B.

These increments are the nearest plan-aligned work that conflicts least with current claim gates **if Option A (orchestration) is chosen**. If Option B is chosen, this backlog is superseded by a Marketplace PRD.

| Priority | Increment | Why low-conflict under Option A | Explicit non-goals |
|----------|-----------|----------------------------------|--------------------|
| 1 | Deepen **Access Map** (shared Care/Transport USP) | Already a public product; strengthens plan’s mapping differentiator without commissions | Pay-to-rank pins; fake “verified accessible” without evidence |
| 2 | Replace journey-planner **demo** with partner **GTFS** (Transport free tier) | Matches plan’s free accessible routing; requires partner data + honesty labels | Invented ETAs/fares; claiming live national coverage without feeds |
| 3 | Keep Care/Transport **transactional UX** behind auth/pilot until GO criteria pass | Aligns with pilot sequencing in both plan and repo | Public “Book now” marketing; marketplace commissions |

**Marketplace commerce** (premium listings, product shop, transaction commissions, ads SKUs) remains **out of scope** for this backlog under Option A and under [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md) (“Broad national worker-marketplace launch”).

**Employment module** remains a separate scope decision (public UI parity vs auth Jobs hardening); this business plan does not define Employment as a pillar.

---

## Related docs

- [COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md)
- [OPERATING_LANES.md](./OPERATING_LANES.md)
- [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md)
- [STRATEGIC_OPPORTUNITIES.md](./STRATEGIC_OPPORTUNITIES.md)
- [docs/modules/care.md](../modules/care.md)
- [docs/modules/transport.md](../modules/transport.md)
- [docs/modules/jobs.md](../modules/jobs.md)
- [docs/operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md) (when present)
