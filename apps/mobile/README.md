# MapAble - AdaptAble Home / Independence Suite

Accessibility-first React Native + Expo implementation of the AdaptAble Home wireframes, hosted in the MapAble repository as an Independence Suite prototype.

## What is implemented

Primary navigation:
- Today
- Home
- Indy
- More

Capability screens:
- MapAble accessible journey planning
- AccessiBooks reading/player prototype
- Disability News & Advocacy source-aware briefing
- My Access accessibility preferences
- Permissions and consent overview
- Activity/audit history
- Support and prototype boundaries

The interface is deliberately user-controlled. Indy presents bounded proposals, shows what data an action needs, and requires explicit approval before consequential actions. Product analytics are off by default in the demo state.

## Accessibility baseline

- 48pt minimum custom interaction targets
- role/name labels for primary controls
- no colour-only state communication
- font scaling remains enabled
- high-contrast, reduced-motion and large-control preferences are represented in shared state
- safe-area-aware screen content
- four primary mobile tabs with secondary destinations under More

## Stack

- Expo SDK 57
- React 19.2
- React Native 0.86
- React Navigation 7 static API
- TypeScript
- React Native Testing Library 14
- Expo web export for Vercel preview deployment

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

Web:

```bash
npm run web
```

Production web export:

```bash
npm run build:web
```

The static web bundle is written to `dist/` and `vercel.json` points Vercel at that directory.

## Validation

```bash
npm run typecheck
npm test
npm run build:web
```

CI runs these checks on pushes and pull requests.

## Prototype boundaries

This repository does **not** currently prove live smart-home control, emergency dispatch, live location sharing, a production AccessiBooks catalogue, live disability-news ingestion, or production MapAble routing. Those integrations remain gated behind real service adapters, identity/consent enforcement, privacy review, operational ownership and production verification.

The current iOS and Android identifiers are prototype identifiers and should be replaced with organisation-controlled production identifiers before store release.

## Design reference

The implementation is based on the wireframe in `docs/wireframe-reference.png`. Supporting implementation and QA notes are in `docs/`.
