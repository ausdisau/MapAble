# Indoor accessibility platform — architecture

## Overview

The indoor accessibility platform extends the existing `/accessibility-map` floor-plan viewer (Iteration 1) with governed publishing, verification, personal fit, indoor routing, operational status, visit sharing, offline packs, checkpoints, multimodal guidance, optional 3D preview, accreditation, and partner APIs (Iterations 2–14).

## Module boundaries

| Layer | Path | Responsibility |
|-------|------|----------------|
| Shared schemas | `lib/indoor-accessibility/schemas/` | Zod contracts, enums, route graph |
| Feature flags | `lib/indoor-accessibility/feature-flags.ts` | Typed flags; server enforcement |
| Permissions | `lib/indoor-accessibility/permissions.ts` | Role gates integrated with `lib/auth/permissions.ts` |
| Domain services | `lib/indoor-accessibility/*/` | Fit, routing, status, sharing, checkpoints |
| APIs | `app/api/indoor/`, `app/api/partners/v1/` | Express-style Next route handlers |
| UI panels | `components/indoor-accessibility/` | Feature-flagged viewer extensions |
| Viewer integration | `components/accessibility-map/floor-plan/FloorPlanViewer.tsx` | Single public viewer |
| Admin | `app/admin/floor-plans/` | Authoring and moderation entry points |
| Docs | `docs/indoor-accessibility/` | Architecture, rollout, privacy |

## Client / server flow

1. Public user opens floor plan via `FloorPlanViewer`.
2. Client fetches feature flags from `GET /api/indoor/feature-flags`.
3. Enabled panels call indoor APIs or run deterministic client engines (fit, routing).
4. Authoring and moderation require authenticated sessions; server enforces permissions independently of UI.

## Publication flow

See [publication-workflow.md](./publication-workflow.md).

## Feature flags

Central module: `lib/indoor-accessibility/feature-flags.ts`. Override via `INDOOR_FLAG_<FLAG_NAME>=true|false`.

## Caching

- Public floor-plan summaries via existing React Query hooks.
- Offline packs in IndexedDB (`lib/indoor-accessibility/offline/pack-manager.ts`).
- Partner API responses should use HTTP cache headers in production (not yet configured).

## External providers

- Outdoor routing: interface in `lib/indoor-accessibility/journeys/journey-planner.ts` (no production provider hard-coded).
- Object storage: existing MapAble upload abstraction for plan assets.
