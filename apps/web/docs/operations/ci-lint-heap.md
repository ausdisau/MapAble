# CI lint memory remediation

**Status:** applied on branch `cursor/ci-lint-heap-remediation-a15c`  
**Related:** PR #473 / #477 CI and CareOS validate OOM

## Problem

GitHub-hosted runners have ~7GB RAM. ESLint with `parserOptions.project` (and the TypeScript import resolver) loads the full TypeScript program. That alone can OOM (exit 134) even when path-sharded, and even when there are no rule violations.

## Fix

1. **CI light mode** — `ESLINT_CI_LIGHT=1` in lint scripts skips `parserOptions.project` and the TypeScript import resolver (see `.eslintrc.cjs`). Type safety remains covered by `pnpm type-check`.
2. **Shard** `pnpm lint` into `lint:app-api`, `lint:app-rest`, `lint:components`, `lint:lib`, `lint:schemas-ci` (4GB heap each, sequential).
3. Add **`pnpm lint:careos`** (light mode + 4GB) and wire `.github/workflows/careos-validation.yml` to it.
4. Cap the main CI job `NODE_OPTIONS` at **6144** so TypeScript/build do not request more heap than typical runners provide.

Local type-aware lint (with `project`) remains available by running eslint without `ESLINT_CI_LIGHT`.

## Out of scope

- **Security / Security** — remediated on `main` via `security/advisory-allowlist.json` (#475/#476).
- **Vercel** — account/permission blocked; restore MapAble Vercel team access externally.
