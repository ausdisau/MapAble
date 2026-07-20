# Migrate-from-zero blocker

**Status:** partial repair landed on `cursor/migration-trust-repair-0a20` — see [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).  
Do not rewrite additional historical migrations without allowlisting and environment evidence.

## Original verified failure (pre-repair)

Command: `pnpm exec prisma migrate deploy` on an empty database.

First failure:

- Migration: `20260525000000_mapable_access_phase_1`
- Prisma: `P3018`
- Database: `ERROR: syntax error at or near "CREATE"` (SQLSTATE `42601`)

Root cause in repository file:

```sql
CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
CREATE INDEX "access_places_status_idx" ON "access_places"("status");
```

The `CREATE TABLE "access_trust_events"` statement was missing the closing `);` before the next `CREATE INDEX`.

## Neon evidence (2026-07-20)

Production branch of Neon project `mapableau` recorded checksum
`52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d` for
`20260525000000_mapable_access_phase_1` — identical to the broken file.
`applied_steps_count` was `0` with `finished_at` set.

Full dump and production checksum update runbook:
[MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).

## Repair applied (allowlisted)

- Close `access_trust_events` with `);`
- New checksum: `277560a68f359fcdc756791eb51446108cdbee24214e39f5504443c3d9a1812b`
- Allowlisted in `scripts/ci/allowed-migration-repairs.json`

## Current remaining blocker (post-syntax repair)

Empty-DB `migrate deploy` now applies through prior migrations, enters
`20260525000000_mapable_access_phase_1`, then fails:

- Prisma: `P3018`
- Database: `ERROR: relation "User" already exists` (SQLSTATE `42P07`)

`mapable_access_phase_1` still contains a near-full schema dump that conflicts with
`init` and earlier migrations. Stub/comment-only core-phase migrations remain
documented in `MIGRATION_INVENTORY.md`.

## Account-owner actions still required

1. After merging the syntax repair: update production `_prisma_migrations.checksum` per the runbook (do not re-run the migration SQL).
2. Resolve `ndis_direct_claiming` rename drift (`20260525000000_*` on prod vs `20260525010000_*` in repo).
3. Approve follow-up baseline / dump de-duplication work before claiming migrate-from-zero green.

## CI policy

- Job name: `Migrate from zero`
- `continue-on-error` **removed**
- Fake `exit 0` **removed**
- A green Migrations workflow must not hide `P3018`
