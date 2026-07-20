# Migrate-from-zero repair (migration trust)

**Status:** in progress — first syntax blocker repaired; full from-zero still red  
**Branch:** `cursor/migration-trust-repair-0a20`  
**Base `main` tip at start:** `8f64dc38`  
**Does not enable NDIS Expansion product waves.** Wave 1 remains blocked until migrate-from-zero is green end-to-end.

## Neon production evidence (fetched 2026-07-20)

Project: `mapableau` (`cold-paper-45965334`)  
Branch: `production` (`br-rough-bush-a7mlsbdx`, default/primary)

Query:

```sql
SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
FROM "_prisma_migrations"
ORDER BY finished_at NULLS LAST, migration_name;
```

### Critical rows

| migration_name                          | checksum (sha256)                                                  | finished_at          | applied_steps_count | Notes                                                        |
| --------------------------------------- | ------------------------------------------------------------------ | -------------------- | ------------------- | ------------------------------------------------------------ |
| `20260525000000_mapable_access_phase_1` | `52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d` | 2026-05-30T01:42:38Z | 0                   | Matched **broken** repo SQL before this repair               |
| `20260525000000_ndis_direct_claiming`   | `634372b56ad57acb27cbdd73a2a1bdab357137ad6076a8ac53feef6f8c48ec52` | 2026-05-30T01:42:43Z | 0                   | Repo folder renamed to `20260525010000_ndis_direct_claiming` |

Many early rows show `applied_steps_count = 0` while `finished_at` is set — consistent with historical resolve / non-statement apply, not a clean multi-statement `migrate deploy` on an empty DB.

Production also records migration names absent from current `main` (e.g. `abilitypay_mvp`, `donations`, `go_live_roadmap`) and is missing many July `main` migrations. Treat prod history and repo history as **drifted**.

## Repair in this PR

### 1. Allowlisted SQL fix — `access_trust_events`

File: `prisma/migrations/20260525000000_mapable_access_phase_1/migration.sql`

Change: close `CREATE TABLE "access_trust_events"` with `);` before the next `CREATE INDEX`.

|                            | sha256                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| **Before** (prod recorded) | `52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d` |
| **After** (this PR)        | `277560a68f359fcdc756791eb51446108cdbee24214e39f5504443c3d9a1812b` |

Allowlist entry: `scripts/ci/allowed-migration-repairs.json`.

### 2. Disposable PostgreSQL verification (this agent)

Command: `prisma migrate deploy` on empty local PostgreSQL 16.

| Stage       | Result                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------- |
| Pre-repair  | **P3018 / 42601** syntax error at `access_trust_events_pkey` → `CREATE INDEX`                 |
| Post-repair | Syntax cleared; migration **starts**; then **P3018 / 42P07** `relation "User" already exists` |

Conclusion: the documented first failure is fixed. `mapable_access_phase_1` is still a near-full schema dump that re-creates objects already created by earlier migrations (`init` …). Full migrate-from-zero requires a **follow-up baseline / dump de-duplication** pass (separate commits after this PR or stacked trust PR #2), plus stub-phase DDL reconciliation (`MIGRATION_INVENTORY.md`).

## Production checksum update runbook (account-owner)

Do **not** run against production until this PR is reviewed. Prefer a staging rehearsal branch first.

After this repair is on the deploy branch that production will pull:

1. Take a DB snapshot / Neon point-in-time restore point.
2. Confirm the applied row still has the old checksum:

   ```sql
   SELECT migration_name, checksum, finished_at, applied_steps_count
   FROM "_prisma_migrations"
   WHERE migration_name = '20260525000000_mapable_access_phase_1';
   ```

3. Update checksum to the repaired file hash (only if the row is already finished and schema objects are already present — do **not** re-run the migration SQL):

   ```sql
   UPDATE "_prisma_migrations"
   SET checksum = '277560a68f359fcdc756791eb51446108cdbee24214e39f5504443c3d9a1812b'
   WHERE migration_name = '20260525000000_mapable_access_phase_1'
     AND checksum = '52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d';
   ```

4. Confirm `prisma migrate status` no longer reports a modified checksum for that migration.
5. **Never** `prisma db push` against production.

### Rename drift — `ndis_direct_claiming`

Production recorded `20260525000000_ndis_direct_claiming`. Repo folder is `20260525010000_ndis_direct_claiming`.

Owner options (choose one after inspection):

- If SQL bodies are equivalent and only the folder name changed: insert/resolve the new name as applied and leave the old row (or document both), following the rename procedure in `MIGRATION_INVENTORY.md`.
- Do not re-execute claiming DDL on production.

## Remaining work before “migrate-from-zero green”

1. De-duplicate / repair `20260525000000_mapable_access_phase_1` so it does not recreate `User` and other objects from `init` (or replace with additive AccessPlace DDL only).
2. Replace comment-only stub migrations with real additive DDL or an approved baseline squash.
3. Re-run empty-DB `prisma migrate deploy` until all migrations apply.
4. CI job `Migrate from zero` green on the repair tip.
5. Then merge Wave 0 [#380](https://github.com/ausdisau/mapableau-new/pull/380) (or rebase it) and only then start NDIS Expansion Wave 1.

## Rollback

- Revert this PR’s commit(s).
- If production checksum was updated, restore the previous checksum `52ecc3b7…` from snapshot notes (only if rolling back the SQL repair as well).
- No product feature flags or NDIS Expansion schema are introduced here.

## Related

- [MIGRATE_FROM_ZERO_BLOCKER.md](./MIGRATE_FROM_ZERO_BLOCKER.md)
- [MIGRATION_INVENTORY.md](./MIGRATION_INVENTORY.md)
- [neon-prisma-migrations.md](../operations/neon-prisma-migrations.md)
- [NDIS_EXPANSION_DELIVERY_SEQUENCE.md](../programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md)
