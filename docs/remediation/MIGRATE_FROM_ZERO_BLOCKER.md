# Migrate-from-zero blocker

**Status:** resolved on branch `cursor/migration-trust-repair-0a20` — empty-DB
`prisma migrate deploy` applies all **57** migrations (PostgreSQL 16 verified).  
See [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md) for checksums,
allowlist, and production checksum update runbook.

Do not rewrite additional historical migrations without allowlisting and
environment evidence.

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

## Repair summary (allowlisted)

1. Close `access_trust_events`; reduce `access_phase_1` to AccessPlace DDL only.
2. Bootstrap `mapable_core_phase_3` and `mapable_care_mvp` stubs for empty-DB deps.
3. Create `IntegrationType` before `ADD VALUE 'search'`.
4. Use `ADD VALUE IF NOT EXISTS` where bootstrap / same-transaction enum rules require it.

Production still needs an **owner-run checksum update** (do not re-run SQL) and
`ndis_direct_claiming` rename-drift reconciliation — see the repair runbook.

## CI policy

- Job name: `Migrate from zero`
- `continue-on-error` **removed**
- Fake `exit 0` **removed**
- A green Migrations workflow must not hide `P3018`
