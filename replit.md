# MapAble Unified on Replit

The repository contains two runnable applications.

Replit's default Run action starts the MapAble web platform from `apps/web`, using that application's existing Replit-aware scripts and configuration.

AdaptAble / Independence Suite lives in `apps/mobile` and remains an Expo + React Native application. Run it using the root mobile scripts when working on the native/mobile experience.

Keep web and mobile dependency installation scoped to their respective application directories. Do not collapse React 18 web dependencies and React 19 mobile dependencies into a single package manifest.
