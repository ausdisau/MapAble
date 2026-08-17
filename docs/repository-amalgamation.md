# Repository amalgamation

## Canonical repository

`ausdisau/MapAble`

## Sources

- Destination/mobile base: `ausdisau/MapAble` at `0b8e8bc8940b70d6f13924a0a3f5cbd6422eb96f`
- Imported web platform: `ausdisau/mapableau-new` at `e0a8b6907b25b23eda82fcbc3b722c088861b704`

## Layout

- `apps/web` preserves the MapAble web application's existing Next.js, Prisma, pnpm workspace, Replit, tests, infrastructure and documentation structure.
- `apps/mobile` preserves the AdaptAble/Independence Suite Expo application.
- root files provide repository-level navigation and delegated commands.

## Dependency boundary

The applications remain separate install roots because the web and mobile applications currently target different React/runtime generations. Shared domain contracts should be extracted deliberately into repository-level packages only after compatibility is verified.
