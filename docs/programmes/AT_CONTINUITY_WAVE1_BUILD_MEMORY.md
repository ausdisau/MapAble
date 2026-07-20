# AT Continuity — Accessibility CI build memory diagnosis (#382)

**Status:** diagnosis + mitigation on PR tip  
**Date:** 2026-07-20

## Symptom

GitHub Actions job `Accessibility` failed during `pnpm build` with:

`FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`

- `NODE_OPTIONS=--max-old-space-size=6144` already set
- Failure occurred **after** `✓ Compiled successfully` (~113s), during the subsequent
  static generation / page-data phase (~4+ minutes later)
- Not during install, Prisma generate, or Playwright execution

## Likely cause

- Application has a large App Router surface that loads the generated Prisma client
  during “Collecting page data” / “Generating static pages”
- Wave 1 adds additive `at_*` models to `schema.prisma`, increasing client size
- `experimental.cpus: 1` was already set, but Next.js 15 still defaults
  `experimental.staticGenerationMaxConcurrency` to **8**, which multiplies peak heap

This is **not** caused by public AT Continuity routes (Wave 1 adds none) and is
**not** fixed by raising heap indefinitely on a ~7 GB GitHub-hosted runner.

## Mitigation applied

1. `experimental.staticGenerationMaxConcurrency: 1` and
   `staticGenerationMinPagesPerWorker: 50` in `next.config.ts` (with `cpus: 1`)
2. Bounded heap **7168** MB for `pnpm build` / Accessibility workflow (single
   documented ceiling short of a larger runner)

Do **not** raise heap further on standard GitHub-hosted runners without moving to
a larger runner (`OWNER_ACTION_REQUIRED`).

## Follow-up performance issue (human)

Open a performance tracking issue to:

1. Profile route imports that eagerly pull `@/lib/prisma` into static generation
2. Consider splitting heavy admin routes / lazy DB access
3. Re-measure peak RSS on Accessibility workflow after concurrency fix

## Verification

Re-run Accessibility workflow on #382 after this change. Record pass/fail in the PR.
If still `FAILED`, leave draft and escalate runner size as `OWNER_ACTION_REQUIRED`.
