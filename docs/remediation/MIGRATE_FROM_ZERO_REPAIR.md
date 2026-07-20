# Migrate-from-zero repair (migration trust)

**Status:** green on disposable empty PostgreSQL 16 (all 57 migrations apply)  
**Branch:** `cursor/migration-trust-repair-0a20`  
**Base `main` tip at start:** `8f64dc38`  
**Does not enable NDIS Expansion product waves.** Wave 1 remains blocked until this lands on `main` and PR #380 is merged.

## Neon production evidence (fetched 2026-07-20)

Project: `mapableau` (`cold-paper-45965334`)  
Branch: `production` (`br-rough-bush-a7mlsbdx`, default/primary)

Production `_prisma_migrations` still records the **pre-repair** checksum for
`20260525000000_mapable_access_phase_1` and shows rename drift
(`20260525000000_ndis_direct_claiming` vs repo `20260525010000_…`). Treat prod
history and repo history as **drifted**. Do **not** re-run repaired SQL on
production; update checksums only after review (runbook below).

## What was repaired (allowlisted)

All paths are listed in `scripts/ci/allowed-migration-repairs.json`.

| Migration | Change | sha256 (this PR) |
| --------- | ------ | ---------------- |
| `20260525000000_mapable_access_phase_1` | Close `access_trust_events` with `);`; reduce dump to AccessPlace-domain DDL only | `4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357` |
| `20260525120000_mapable_care_mvp` | Replace comment stub with Incident\* enums + `IncidentReport` | `b71b9ad56d6d1abf392d034b6a17cea88ab24cb8e4c3610b555035779d24271e` |
| `20260521180000_mapable_core_phase_3` | Bootstrap core DDL: `@@map` table names, stub enrichment (`WorkerProfile` / `Vehicle` / `DriverProfile`), `care_bookings` / `care_service_*` pre-ALTER shapes; enums omit labels later migrations `ADD VALUE` (except same-transaction-safe labels) | `1c286a3be61f60f752003b3071dc6b399418950c657695d929aa3465d442f96c` |
| `20260611120000_integration_type_search` | Create `IntegrationType` before `ALTER TYPE … ADD VALUE 'search'` | `998a7bec20978057147c0dde0426b01cc8b04d972e69ceffbe5781991d9503dd` |
| `20260626120000_payout_ledger` | `ADD VALUE IF NOT EXISTS` for labels that may already exist | `8c9daf859e1807f02cd77786ae673abf7729e5406e585c1ffcb1f3c70494eae6` |
| `20260527120000_transport_scheduling_routing` | `ADD VALUE IF NOT EXISTS` | `10188a38cf53b12748f17979fcb270ca54a07f079f66168c8b4f381ec82f1fcf` |
| `20260603120000_y1_wedge` | `ADD VALUE IF NOT EXISTS` | `3b64acfaa16e5082941b20330366c392c3b359c7c08fe5d0cd8b89b93fab7bda` |
| `20260604120000_engagement_platform` | `ADD VALUE IF NOT EXISTS` | `60313d968f1d94afad73b0ad60ff7af857badecf6a620e22d3ca9cdab116e510` |
| `20260717020000_billing_centre_foundations` | `ADD VALUE IF NOT EXISTS` | `316ad71cb1ee22396a44516a94bfc9408dae24714f99168ff7b34b86049413af` |

Prod recorded checksum for broken `access_phase_1` (pre-repair):
`52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d`.

## Disposable PostgreSQL verification

```bash
# empty DB
DATABASE_URL=postgresql://postgres@localhost:5432/mapable_mfz npx prisma migrate deploy
# → All 57 migrations have been successfully applied.
npx prisma migrate status
# → Database schema is up to date!
```

Verified on PostgreSQL 16 (`mapable_mfz`) during this repair.

## Production checksum update runbook (account-owner)

Do **not** run against production until this PR is reviewed. Prefer a staging rehearsal branch first.

After this repair is on the deploy branch that production will pull:

1. Take a DB snapshot / Neon point-in-time restore point.
2. Confirm the applied row still has the old checksum for each repaired migration that production already recorded as finished.
3. Update `_prisma_migrations.checksum` to the new file hash **only** when:
   - the row is already finished, and
   - schema objects are already present — do **not** re-run the migration SQL.
4. Example for `access_phase_1` (adjust hash if the landed file differs):

   ```sql
   UPDATE "_prisma_migrations"
   SET checksum = '4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357'
   WHERE migration_name = '20260525000000_mapable_access_phase_1'
     AND checksum = '52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d';
   ```

5. Confirm `prisma migrate status` no longer reports modified checksums for repaired rows.
6. Never use `prisma db push` on production.

## Rollback notes

- Revert this PR’s migration SQL and allowlist entries together.
- If production checksum was updated, restore the previous checksum from snapshot notes (only if rolling back the SQL repair as well).

## Gate for NDIS Expansion Wave 1

Sequence (human merges; agent does not merge):

1. Land this PR → migrate-from-zero green on `main`
2. Merge Wave 0 docs PR #380
3. Start Wave 1 (AT Continuity) from fresh `main` with flags off
