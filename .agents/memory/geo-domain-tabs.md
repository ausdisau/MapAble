---
name: Geo layers need multi-domain tags for domain tabs
description: Accessibility Map DomainTabBar filters layers by map_layers.domains[]; single-domain seeds leave tabs empty.
---
The Accessibility Map (`/accessibility-map`) DomainTabBar (Accessibility/Care/Transport/Employment) filters layers via `GET /api/geo/layers?domain=X` → `X = ANY(map_layers.domains)`.

**Why:** Seeding every layer with only `["accessibility"]` makes the Care/Transport/Employment tabs render "No layers in this domain yet" even though tab-swapping works. Each seed layer must carry ALL domains it is relevant to.
**How to apply:** When adding/seeding geo layers, set a sensible multi-domain `domains[]` (e.g. parking/stairs/lifts/routes → accessibility+transport; DPO/NDAP → accessibility+care+employment). Backfill legacy rows by slug — the seed only runs on an empty DB, so live data needs a separate idempotent UPDATE (see migrations/0009).
