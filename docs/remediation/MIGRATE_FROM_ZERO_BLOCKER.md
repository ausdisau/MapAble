# Migrate-from-zero blocker

**Empty-database status:** **`VERIFIED` green** on `origin/main` after PR **#381**  
**Main tip:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Evidence:** GitHub Actions `Migrate from zero` success on `main` (post-#381 / #380); see [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).

This file retains the historical P3018 failure for audit. It is **not** the active empty-database blocker.

**Still blocked / owner-owned:**

- Production `_prisma_migrations` checksum reconciliation after repaired SQL
- `ndis_direct_claiming` rename-drift reconciliation on production
- Any checksum update without snapshot/PITR + staging-clone rehearsal + account-owner approval

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

## Neon evidence (2026-07-20, historical)

Production branch of Neon project `mapableau` recorded checksum
`52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d` for
`20260525000000_mapable_access_phase_1` — identical to the broken file.
`applied_steps_count` was `0` with `finished_at` set.

Treat this as **production-account evidence of drift**, not as an empty-DB CI failure.

## Repair summary (allowlisted; landed via #381)

1. Close `access_trust_events`; reduce `access_phase_1` to AccessPlace DDL only.
2. Bootstrap `mapable_core_phase_3` and `mapable_care_mvp` stubs for empty-DB deps.
3. Create `IntegrationType` before `ADD VALUE 'search'`.
4. Use `ADD VALUE IF NOT EXISTS` where bootstrap / same-transaction enum rules require it.

Production still needs an **owner-run checksum update** (do not re-run SQL) and
rename-drift reconciliation — see the repair runbook.

## CI policy

- Job name: `Migrate from zero`
- `continue-on-error` **removed**
- Fake `exit 0` **removed**
- A green Migrations workflow must not hide `P3018`
- Empty-DB green **does not** prove production history is reconciled
