# Indoor accessibility — data model

## Core tables (Prisma)

- `AccessFloorPlan` — floor plan versions with `publicationStatus`, `structuredData` JSON document
- `FloorPlanCorrectionProposal` — community correction proposals
- `IndoorAccessibilityIncident` — temporary operational status
- `VisitPlan`, `VisitPlanShare` — selective visit sharing
- `IndoorCheckpoint` — QR/NFC checkpoint registry
- `PartnerApiClient` — hashed partner API keys
- `AccessibilityPreferenceProfile` — optional saved functional preferences

## Structured floor plan document

Stored in `AccessFloorPlan.structuredData`:

- `features`, `zones`, `routes`, `connectors` (Iteration 1)
- `routeGraph` (optional, Iteration 5) — nodes and edges for verified indoor routing

## Versioning

Published floor plans are immutable. Publishing supersedes prior published versions with the same `floorCode`.

## Visibility

`AccessFloorPlanVisibility`: `public`, `authenticated`, `restricted`, `staffOnly`. Public APIs return only `published` + `public` plans.

## Trust states

`TrustLevel` enum in `lib/access/indoor/schemas/core.ts`. Feature `status` on floor-plan features maps to trust labels in the UI.

## Status precedence

Deterministic resolver: `lib/access/indoor/status/incident-resolver.ts`.
