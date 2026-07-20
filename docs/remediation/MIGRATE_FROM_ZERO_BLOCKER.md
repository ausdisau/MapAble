# Migrate-from-zero blocker

**Status:** hard CI failure (truthful). Do not rewrite historical migrations without verified `_prisma_migrations` evidence from every persistent environment.

## Verified reproduction (disposable PostgreSQL)

Command: `pnpm exec prisma migrate deploy` on an empty database.

First failure:

- Migration: `20260525000000_mapable_access_phase_1`
- Prisma: `P3018`
- Database: `ERROR: syntax error at or near "CREATE"` (SQLSTATE `42601`)
- Character offset ≈ `127592` in `migration.sql`

Root cause in repository file (not applied successfully on a fresh DB):

```sql
CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
CREATE INDEX "access_places_status_idx" ON "access_places"("status");
```

The `CREATE TABLE "access_trust_events"` statement is missing the closing `);` before the next `CREATE INDEX`.

## Why this PR does not rewrite the SQL

Hard stop: production/staging migration history and checksums were **not** available to this agent (no database credentials; Neon/Vercel account-owner access required). Editing an already-shipped migration folder changes the Prisma checksum and can break environments that recorded a different history (including `migrate resolve --applied` after a failed attempt).

## Additional blockers after the syntax fix

Even after closing `access_trust_events`, migrate-from-zero remains blocked by multiple **stub** migrations (comments-only / incomplete DDL) documented in `MIGRATION_INVENTORY.md` (Core phase folders, care MVP, case management, etc.). A full baseline/squash or verified forward-repair plan is required (Wave 1).

## Account-owner evidence required

From each persistent environment (production, staging, any shared Neon branch used as truth):

```sql
SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
FROM "_prisma_migrations"
ORDER BY finished_at;
```

Also provide whether production schema was historically created via `db push` rather than `migrate deploy`.

## Safe reconciliation strategies (do not execute without evidence)

| Environment          | Strategy                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Completely fresh DB  | After verified repair/squash, `prisma migrate deploy` must succeed end-to-end; CI job `Migrate from zero` is the gate                    |
| Existing deployed DB | Compare checksums; if broken file never applied, prefer a **new** forward migration or baseline squash — do not silently rewrite history |
| Staging rehearsal    | Restore prod-like backup → apply proposed repair → run app smoke + migrate status                                                        |
| Rollback / recovery  | Keep pre-change DB snapshot; use `migrate resolve` only with written runbook                                                             |

## CI policy

- Job name: `Migrate from zero`
- `continue-on-error` **removed**
- Fake `exit 0` **removed**
- A green Migrations workflow must not hide `P3018`
