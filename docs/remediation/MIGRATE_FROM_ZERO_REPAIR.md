# Migrate-from-zero repair (migration trust)

**Empty-DB status:** **`VERIFIED` green** on disposable PostgreSQL / CI  
**Landed on `main` via:** PR **#381** (merge `78f95d40`), tip includes #380 docs  
**Main tip at ledger refresh:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Does not prove production `_prisma_migrations` is reconciled.**

## Separation of environments

| Environment                                          | Status                  | Meaning                                                     |
| ---------------------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| Disposable empty PostgreSQL / CI `Migrate from zero` | `VERIFIED`              | Repository migrations can deploy from zero                  |
| Production Neon history                              | `OWNER_ACTION_REQUIRED` | Checksums / rename drift may still disagree with repo files |
| Staging clone rehearsal                              | `NOT_RUN`               | Required before any production checksum SQL                 |

Repository migrations may deploy from zero. That does **not** prove production history is reconciled. Checksum updates require snapshot/PITR, staging-clone rehearsal, and account-owner approval. Never update production checksums from this agent role.

## Neon production evidence (fetched 2026-07-20; do not re-fetch secrets)

Project: `mapableau` (id recorded in prior repair notes)  
Branch: `production` (primary)

Production `_prisma_migrations` still recorded the **pre-repair** checksum for
`20260525000000_mapable_access_phase_1` and showed rename drift
(`20260525000000_ndis_direct_claiming` vs repo `20260525010000_…`). Treat prod
history and repo history as **drifted** until owner reconciliation completes.
Do **not** re-run repaired SQL on production; update checksums only after review.

## What was repaired (allowlisted)

All paths are listed in `scripts/ci/allowed-migration-repairs.json`.

| Migration                                     | Change                                                                            | sha256 (repair PR)                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `20260525000000_mapable_access_phase_1`       | Close `access_trust_events` with `);`; reduce dump to AccessPlace-domain DDL only | `4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357` |
| `20260525120000_mapable_care_mvp`             | Replace comment stub with Incident\* enums + `IncidentReport`                     | `b71b9ad56d6d1abf392d034b6a17cea88ab24cb8e4c3610b555035779d24271e` |
| `20260521180000_mapable_core_phase_3`         | Bootstrap core DDL for empty-DB deps                                              | `1c286a3be61f60f752003b3071dc6b399418950c657695d929aa3465d442f96c` |
| `20260611120000_integration_type_search`      | Create `IntegrationType` before `ADD VALUE 'search'`                              | `998a7bec20978057147c0dde0426b01cc8b04d972e69ceffbe5781991d9503dd` |
| `20260626120000_payout_ledger`                | `ADD VALUE IF NOT EXISTS`                                                         | `8c9daf859e1807f02cd77786ae673abf7729e5406e585c1ffcb1f3c70494eae6` |
| `20260527120000_transport_scheduling_routing` | `ADD VALUE IF NOT EXISTS`                                                         | `10188a38cf53b12748f17979fcb270ca54a07f079f66168c8b4f381ec82f1fcf` |
| `20260603120000_y1_wedge`                     | `ADD VALUE IF NOT EXISTS`                                                         | `3b64acfaa16e5082941b20330366c392c3b359c7c08fe5d0cd8b89b93fab7bda` |
| `20260604120000_engagement_platform`          | `ADD VALUE IF NOT EXISTS`                                                         | `60313d968f1d94afad73b0ad60ff7af857badecf6a620e22d3ca9cdab116e510` |
| `20260717020000_billing_centre_foundations`   | `ADD VALUE IF NOT EXISTS`                                                         | `316ad71cb1ee22396a44516a94bfc9408dae24714f99168ff7b34b86049413af` |

Prod recorded checksum for broken `access_phase_1` (pre-repair):
`52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d`.

## Disposable PostgreSQL verification

```bash
# empty DB
DATABASE_URL=postgresql://postgres@localhost:5432/mapable_mfz npx prisma migrate deploy
# → All migrations have been successfully applied (CI-verified on main).
npx prisma migrate status
# → Database schema is up to date!
```

## Production checksum update runbook (account-owner)

**Status:** `OWNER_ACTION_REQUIRED` — do not execute from this agent.

Prefer a staging rehearsal branch first.

After the repair is on the deploy branch that production will pull:

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
7. Never invent or print database credentials in tickets or chat.

## Rollback notes

- Revert the migration SQL and allowlist entries together.
- If production checksum was updated, restore the previous checksum from snapshot notes (only if rolling back the SQL repair as well).

## Gate for NDIS Expansion Wave 1

Sequence (human merges; agent does not merge):

1. ~~Land migrate-from-zero repair~~ — **done** (#381 on `main`)
2. ~~Merge Wave 0 docs~~ — **done** (#380 on `main`)
3. Repair #382 CI/a11y; keep `MAPABLE_AT_CONTINUITY_ENABLED=false`
4. Independent review + human preview acceptance
5. Owner production checksum reconciliation remains separate and may proceed in parallel without enabling Wave 1 flags
