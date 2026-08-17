# MapAble — AdaptAble Home / Independence Suite

Accessibility-first Expo + React Native application inside the unified `ausdisau/MapAble` repository.

## What is implemented

Primary navigation:

- Today
- Home
- Indy
- More

Current capability areas:

- AdaptAble Home prototype controls and routines
- Indy bounded proposal and approval flow
- MapAble accessible-place search connected to the unified web platform when configured
- AccessiBooks prototype card
- Disability News & Advocacy prototype card
- My Access accessibility preferences
- Permissions overview
- Activity/audit example
- Support and prototype boundaries

The interface is deliberately user-controlled. Indy requires explicit approval before consequential prototype actions. Product analytics are off by default.

## MapAble platform connection

The mobile app can call the existing web endpoint `GET /api/access/search` through `src/runtime/mapableApi.ts`.

Copy `.env.example` to `.env` and set:

```text
EXPO_PUBLIC_MAPABLE_API_URL=https://your-mapable-web-host.example
```

`EXPO_PUBLIC_*` values are public client configuration and must never contain secrets.

The first integrated search slice sends only the search text explicitly entered by the user. It does not request or transmit live device location. If the API URL is not configured, the UI displays a clear not-configured state instead of pretending prototype content is live data.

See `../../docs/mobile-web-integration.md` for the contract and deployment notes.

## Accessibility baseline

- 48pt minimum custom interaction targets
- role/name labels for primary controls
- no colour-only state communication
- font scaling remains enabled
- high-contrast and reduced-motion preferences represented in shared state
- explicit loading and error states for live search
- confidence/source context kept visible for MapAble results

## Stack

- Expo SDK 57
- React 19.2
- React Native 0.86
- React Navigation 7 static API
- TypeScript

## Run locally

```bash
npm install
npm start
```

Native development:

```bash
npm run ios
npm run android
```

Web development:

```bash
npm run web
```

Static Expo web export:

```bash
npm run build:web
```

## Validation

```bash
npm run typecheck
```

Repository CI installs the mobile dependencies, runs the TypeScript check, and verifies that the mobile MapAble client remains anchored to the existing web search contract.

## Prototype boundaries

This application does **not** currently prove live smart-home control, emergency dispatch, automatic support-worker notification, production AccessiBooks catalogue access, live disability-news ingestion, or production journey routing.

The MapAble place-search integration can return live platform data only when a real MapAble API host is configured. Accessibility information can change, so confidence and source context should remain visible and users should be able to review details before relying on them.

Authenticated participant, worker, driver and provider-admin workflows remain pending a reviewed native authentication and consent design.
