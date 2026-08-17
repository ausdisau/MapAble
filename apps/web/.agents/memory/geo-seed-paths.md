---
name: Geo seed runs in both paths
description: server/seed.ts has two branches; new seed steps must be added to both
---

`seedDatabase()` in `server/seed.ts` has two distinct branches:
1. existing-DB branch (`if (existingUsers.length > 0) { ...; return; }`) — runs backfills/idempotent re-seeds.
2. fresh-DB branch (after the early return) — inserts base users/jobs/etc, ends with "Database seeded successfully".

**Why:** a new seed step (e.g. geo data) added to only one branch silently skips on the other —
on a brand-new DB the fresh branch runs and the existing-DB block never executes, so the data
is missing until a later restart re-seed.

**How to apply:** when adding a new seed call, wire it into BOTH branches (or refactor it to run
unconditionally at the end) and make the underlying seed function idempotent (no-op if data exists).
