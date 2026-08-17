# MapAble Unified

This is the canonical MapAble repository for Australian Disability Ltd's connected accessibility and independence platform work.

## Applications

- `apps/web` — the existing MapAble web platform imported from `ausdisau/mapableau-new`.
- `apps/mobile` — the AdaptAble Home / Independence Suite Expo + React Native application previously at the root of `ausdisau/MapAble`.

The applications intentionally keep independent dependency roots because the web platform currently uses Next.js/React 18 while the mobile application uses Expo SDK 57/React 19. Combining them into one dependency manifest would create an unnecessary runtime conflict.

## Common commands

```bash
corepack enable

# Web
pnpm --dir apps/web install --frozen-lockfile
pnpm dev:web

# Mobile
npm --prefix apps/mobile install
npm run dev:mobile
```

Replit launches the web platform by default. The mobile app can be run separately with the root mobile scripts.

## Repository provenance

The web platform was imported from `ausdisau/mapableau-new` and the mobile application originated in `ausdisau/MapAble`. A pre-amalgamation backup branch was retained before this integration.
