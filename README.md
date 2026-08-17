# MapAble Unified

This is the canonical MapAble repository for Australian Disability Ltd's connected accessibility and independence platform work.

## Applications

- `apps/web` — the MapAble web platform imported from the former standalone `ausdisau/mapableau-new` repository.
- `apps/mobile` — the AdaptAble Home / Independence Suite Expo + React Native application.

The applications intentionally keep independent dependency roots because the web platform currently uses Next.js/React 18 while the mobile application uses Expo SDK 57/React 19. Combining them into one dependency manifest would create an unnecessary runtime conflict.

## Repository status

`ausdisau/MapAble` is now the single canonical development repository.

The standalone `ausdisau/mapableau-new` repository has been marked as migrated. Its final imported application commit was `e0a8b6907b25b23eda82fcbc3b722c088861b704`, and that source tree is preserved under `apps/web` with Git history retained through the subtree import.

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

## Development boundaries

- Keep web dependencies scoped to `apps/web`.
- Keep Expo/React Native dependencies scoped to `apps/mobile`.
- Do not collapse the React 18 and React 19 dependency roots.
- Extract shared domain contracts into repository-level packages only when runtime compatibility and ownership are clear.
- New MapAble work should be committed here rather than to the migrated standalone repository.

## Repository provenance

The web platform originated in `ausdisau/mapableau-new`; the AdaptAble mobile application originated in `ausdisau/MapAble`. The amalgamation record is documented in `docs/repository-amalgamation.md`.
