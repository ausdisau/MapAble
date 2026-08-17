# Phase 3 QA

## Automated tests
`pnpm test` — `tests/mapable-phase3.test.ts` covers permissions, vehicle warnings, adjustment privacy.

## Manual checks
1. Login as `participant@mapable.test` — create care request from `/care/request` or via Provider Finder **Request care** CTA (when outlet maps to a platform org), submit, confirm redirect to `/care/bookings` or `/dashboard/care/matches/[id]` when matching runs
2. On `/care/bookings`, verify **Requests in progress** shows submitted requests awaiting assignment (not an empty page)
3. Login as `admin@mapable.test` — open `/admin/service-ops/care`, assign provider from `/admin/care/[careRequestId]` UI (no curl), create shift, service ops summary
4. Login as `provider@mapable.test` — control panel shows **Service-ready** or **Not service-ready** badge; accept care request when assigned
5. Attempt assign-provider to a non-ready org — API/UI returns 409 with blocker list
6. Create transport booking with wheelchair requirement — verify warning when vehicle mismatched
7. Apply for job without sharing adjustments — employer view shows placeholder text
8. Calendar lists care, transport, and job events

## Seed
`pnpm prisma db seed` after Phase 1+2+3 seeds.

Password for test users: same as legacy seed (`Password123!` per Phase 1 docs).
