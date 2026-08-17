# MapAble Mobile App Architecture

The unified repository now contains a real Expo + React Native client at `apps/mobile`.

This directory remains the web platform's contract and architecture reference for mobile integration. It must describe contracts that the native client can safely consume; it is no longer only a future-app scaffold.

## Current implementation state

Implemented in `apps/mobile`:

- Expo SDK 57 / React Native client;
- React Navigation 7 primary navigation;
- AdaptAble Home / Independence Suite prototype screens;
- explicit Indy approval boundary for consequential prototype actions;
- accessibility and consent-oriented UI state;
- configuration-gated MapAble accessible-place search using `GET /api/access/search`;
- explicit no-live-location behaviour for the first search slice.

The native application is **not yet a production participant/worker/driver/provider app**. Authenticated role workflows remain to be integrated deliberately.

## Principles

- Reuse reviewed REST APIs under `/api/*` rather than creating duplicate backends.
- Keep web-side Zod schemas in `mobile-contracts/schemas` as contract evidence until a deliberately shared, runtime-compatible package is established.
- Do not copy privileged NextAuth cookies, secrets, or server credentials into the mobile bundle.
- Authenticated native access requires an explicit session/token-exchange design.
- Offline support is limited to workflows that have been explicitly designed for safe local drafting.
- Accessibility remains a release criterion: labelled controls, scalable text, clear focus order, large interaction targets, reduced-motion support and colour-independent status.
- Location, emergency, support-worker and other high-impact actions require explicit permission and must not be inferred from model output.

## Layers

1. **Native UI** — `apps/mobile` screens and accessibility interactions.
2. **Mobile API client** — typed wrappers in `apps/mobile/src/runtime`.
3. **Web REST APIs** — reviewed handlers in `apps/web/app/api`.
4. **Contract evidence** — Zod schemas in `mobile-contracts/schemas` plus API-domain schemas such as `types/access-map.ts`.
5. **Identity and consent** — explicit native authentication/authorization boundary before protected APIs are enabled.
6. **Offline layer** — only for approved draft/cache workflows with clear reconciliation behaviour.

## First integrated vertical slice

Accessible-place search:

- Native client: `apps/mobile/src/runtime/mapableApi.ts`
- Web endpoint: `app/api/access/search/route.ts`
- Query schema: `types/access-map.ts` → `accessSearchQuerySchema`
- Current native fields: text query, `limit=5`, `sort=relevance`
- Explicitly excluded from the first slice: automatic latitude/longitude transmission and background location.

See the repository-level `docs/mobile-web-integration.md` for the integration contract and deployment notes.
