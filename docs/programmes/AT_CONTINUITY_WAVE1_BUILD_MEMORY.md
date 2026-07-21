# AT Continuity — Accessibility CI build memory diagnosis (#382)

**Status:** mitigation on PR tip; Accessibility CI green; Vercel preview memory retuned  
**Date:** 2026-07-20

## Symptom A — GitHub Accessibility (resolved)

GitHub Actions job `Accessibility` failed during `pnpm build` with:

`FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`

- Failure occurred **after** `✓ Compiled successfully`, during static generation
- Mitigated by `experimental.staticGenerationMaxConcurrency: 1` +
  `staticGenerationMinPagesPerWorker: 50` and a 7168 MB heap on GitHub Actions

**Verification:** Accessibility workflow on tip `2933873d` — **pass** (~10m28s).

## Symptom B — Vercel preview SIGKILL (this follow-up)

Vercel deployment `dpl_H9xrsrEVyhLdm2aTWRJQ8a4aEFDr` failed with:

`Next.js build worker exited with code: null and signal: SIGKILL`

Cause: `package.json` pinned `--max-old-space-size=7168` for all builders. On
Vercel’s preview container that requests an OS kill before JS heap OOM.

## Mitigation applied

1. Keep SSG concurrency at **1** / min pages per worker **50** (`next.config.ts`)
2. Replace hardcoded build heap with `scripts/run-next-build.mjs`:
   - Vercel (`VERCEL=1`): **4608** MB
   - GitHub Actions: **7168** MB
   - Local default: **6144** MB
   - Override: `MAPABLE_BUILD_HEAP_MB`

Do **not** raise the Vercel heap back to 7168 without a larger build machine
(`OWNER_ACTION_REQUIRED`).

## Follow-up performance issue (human)

Open a performance tracking issue to:

1. Profile route imports that eagerly pull `@/lib/prisma` into static generation
2. Consider splitting heavy admin routes / lazy DB access
3. Re-measure peak RSS on Accessibility + Vercel preview after this change

## Verification checklist

| Surface | Status |
| ------- | ------ |
| Accessibility workflow | `VERIFIED` pass on `2933873d` |
| CI workflow | `VERIFIED` pass on `2933873d` |
| Vercel preview after heap retune | `NOT_RUN` until redeploy |
