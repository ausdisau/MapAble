# Wave 1 — A-continue: `_prisma_migrations` reconciliation

**Decision:** **A-continue** (approved 2026-07-25) — keep repaired historical SQL; reconcile deployed DB history; **no squash**.  
**Agent role:** read-only evidence + owner SQL pack. **Do not** execute production `UPDATE`s from this agent.  
**Repo tip at evidence:** `cbcff881` (+ this docs PR)  
**Empty-DB status:** still `VERIFIED` green (58/58) — unchanged by this workstream.

---

## 1. Fresh read-only evidence (2026-07-25)

| Source            | Detail                                                                                                                                                                                            | Status     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Neon project      | `mapableau` (`cold-paper-45965334`), region `aws-ap-southeast-2`, PG 17                                                                                                                           | `VERIFIED` |
| Production branch | `production` / `br-rough-bush-a7mlsbdx` (primary)                                                                                                                                                 | `VERIFIED` |
| Dev branch        | `vercel-dev` / `br-fancy-night-a7s8qh4g` — only **3** early migrations; **not** a staging clone of prod                                                                                           | `VERIFIED` |
| Export artefact   | [artifacts/production-prisma-migrations-2026-07-25.json](./artifacts/production-prisma-migrations-2026-07-25.json) (name, checksum, finished, rolled_back, applied_steps_count only — no secrets) | `VERIFIED` |
| Compare helper    | `pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts --exported …` → `aligned: false`                                                                                                  | `VERIFIED` |

**Critical prod anomalies:**

1. Many early rows have `finished_at` set but `applied_steps_count = 0` (including broken `access_phase_1`). Treat as **history bookkeeping**, not proof the SQL ran.
2. Unfinished row: `20260525010000_ndis_direct_claiming` (`finished_at` NULL, `applied_steps_count = 0`) while old name `20260525000000_ndis_direct_claiming` is finished with the **same** checksum as the repo file under the new name.
3. Rolled-back attempts exist for `accessible_ride_share` and `payout_ledger` (harmless if a finished successor row exists).

---

## 2. Drift summary (prod finished names vs repo)

### 2.1 Checksum mismatches (same migration name)

| Migration                                      | Prod checksum (prefix)    | Repo checksum (prefix) | Allowlisted repair?                                                                                |
| ---------------------------------------------- | ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| `20260521120000_mapable_core_phase_2`          | `8bb553d5…`               | `be2f2253…`            | Yes                                                                                                |
| `20260521180000_mapable_core_phase_3`          | `9257daf0…`               | `1c286a3b…`            | Yes                                                                                                |
| `20260525000000_mapable_access_phase_1`        | `52ecc3b7…` (broken file) | `4e6d7d1f…`            | Yes                                                                                                |
| `20260525120000_mapable_care_mvp`              | `ce29f96b…`               | `b71b9ad5…`            | Yes                                                                                                |
| `20260527120000_transport_scheduling_routing`  | `a0891aa6…`               | `10188a38…`            | Yes                                                                                                |
| `20260603120000_y1_wedge`                      | `0cf4fea9…`               | `3b64acfa…`            | Yes                                                                                                |
| `20260604120000_engagement_platform`           | `a42d4f55…`               | `60313d96…`            | Yes                                                                                                |
| `20260611120000_integration_type_search`       | `ee17e1cf…`               | `998a7bec…`            | Yes                                                                                                |
| `20260626120000_payout_ledger`                 | `5b045a6e…`               | `8c9daf85…`            | Yes                                                                                                |
| `20260608130000_ndis_provider_outlet_registry` | `f388539d…`               | `44fe25d3…`            | **No** (historical edit in `0841b48e` — unique index → non-unique; later covered by `…08140000_…`) |

Full hashes are in §5 SQL pack and the JSON artefact.

### 2.2 Name / inventory drift

**Only in production (not in repo folders):**

| Name                                             | Note                                           |
| ------------------------------------------------ | ---------------------------------------------- |
| `20260525000000_ndis_direct_claiming`            | Old folder name — rename drift                 |
| `20260603180000_go_live_roadmap`                 | Applied historically; folder removed from repo |
| `20260611140000_abilitypay_mvp`                  | Applied historically; folder removed from repo |
| `20260611180000_provider_outlet_classifications` | Applied historically; folder removed from repo |
| `20260612120000_donations`                       | Applied historically; folder removed from repo |
| `20260714010000_access_marker_feedback`          | Applied historically; folder removed from repo |

**Only in repo (not finished in production):**

| Name                                                                                  | Note                                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `20260525010000_ndis_direct_claiming`                                                 | Rename target — unfinished failed/attempt row present |
| `20260716120000_indoor_accessibility_platform` … `20260720120000_at_continuity_wave1` | **12** forward migrations not yet applied to prod     |

Do **not** run bare `prisma migrate deploy` on production until §3 rename + checksum steps complete — deploy would otherwise hit modified-checksum errors and/or the unfinished rename row.

### 2.3 `vercel-dev`

Not usable as a staging rehearsal of production history (only init/session/password migrations). Owner must create a **Neon branch from `production`** for staging-clone rehearsal.

---

## 3. Owner procedure (ordered)

**Hard rules:** snapshot/PITR first · rehearse on a clone · never `prisma db push` · never re-run repaired migration SQL · never delete production data tables as part of this pack.

### Step 0 — Create staging clone

1. Neon Console → project `mapableau` → create branch from `production` (e.g. `wave1-migration-rehearsal`).
2. Point a throwaway `DATABASE_URL` / `DIRECT_URL` at the clone only.
3. Re-export `_prisma_migrations` and confirm it matches the artefact shape.

### Step 1 — Resolve `ndis_direct_claiming` rename (clone first)

Goal: production history should record **only** `20260525010000_ndis_direct_claiming` as finished, with checksum `634372b56ad57acb27cbdd73a2a1bdab357137ad6076a8ac53feef6f8c48ec52` (matches repo file).

```sql
-- A) Inspect
SELECT id, migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name LIKE '%ndis_direct_claiming%'
ORDER BY started_at;

-- B) Drop the unfinished new-name attempt (safe when finished_at IS NULL AND applied_steps_count = 0)
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260525010000_ndis_direct_claiming'
  AND finished_at IS NULL
  AND applied_steps_count = 0
  AND rolled_back_at IS NULL;

-- C) Rename the finished old-name row to the repo folder name (checksum already matches repo)
UPDATE "_prisma_migrations"
SET migration_name = '20260525010000_ndis_direct_claiming'
WHERE migration_name = '20260525000000_ndis_direct_claiming'
  AND checksum = '634372b56ad57acb27cbdd73a2a1bdab357137ad6076a8ac53feef6f8c48ec52'
  AND finished_at IS NOT NULL
  AND rolled_back_at IS NULL;
```

Expect: one finished row named `20260525010000_ndis_direct_claiming`.

### Step 2 — Checksum updates for allowlisted repairs (clone first)

Update **checksum only** where the finished row still has the old hash. Do **not** re-apply SQL.

```sql
UPDATE "_prisma_migrations" SET checksum = 'be2f22538d8cd0ffb678101d970a0ad0bcd8aa40d55de1a04294c81e4099f5c6'
WHERE migration_name = '20260521120000_mapable_core_phase_2'
  AND checksum = '8bb553d5d43c3dfa0041a88f4e604563b6dfc66c74d9e2e5044ad090401e4edd'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '1c286a3be61f60f752003b3071dc6b399418950c657695d929aa3465d442f96c'
WHERE migration_name = '20260521180000_mapable_core_phase_3'
  AND checksum = '9257daf07149ac283af78a0925d440040d3b4c6f4977bc573c5189e437c2fab5'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357'
WHERE migration_name = '20260525000000_mapable_access_phase_1'
  AND checksum = '52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = 'b71b9ad56d6d1abf392d034b6a17cea88ab24cb8e4c3610b555035779d24271e'
WHERE migration_name = '20260525120000_mapable_care_mvp'
  AND checksum = 'ce29f96b9c8c47ca6ea1becdef8e6945c7203fd3f3da10d85804a591e5a5d103'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '10188a38cf53b12748f17979fcb270ca54a07f079f66168c8b4f381ec82f1fcf'
WHERE migration_name = '20260527120000_transport_scheduling_routing'
  AND checksum = 'a0891aa6abb5bb0f2c4b7e03b20a7836b67d450b6c74b7fb76c1e71998ee1c3a'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '3b64acfaa16e5082941b20330366c392c3b359c7c08fe5d0cd8b89b93fab7bda'
WHERE migration_name = '20260603120000_y1_wedge'
  AND checksum = '0cf4fea9dae97ec8c95b6f18a64bb1a345cde4690bb00bd40ba7b5a17b298c2b'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '60313d968f1d94afad73b0ad60ff7af857badecf6a620e22d3ca9cdab116e510'
WHERE migration_name = '20260604120000_engagement_platform'
  AND checksum = 'a42d4f55f93654c5fc9def2d11f757cd2ef786b5a97b892d50f4849f5637a9cc'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '998a7bec20978057147c0dde0426b01cc8b04d972e69ceffbe5781991d9503dd'
WHERE migration_name = '20260611120000_integration_type_search'
  AND checksum = 'ee17e1cfb1c1626c7f787eb4520bbc9096eca866c6f9d700c249e3031773bb6d'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;

UPDATE "_prisma_migrations" SET checksum = '8c9daf859e1807f02cd77786ae673abf7729e5406e585c1ffcb1f3c70494eae6'
WHERE migration_name = '20260626120000_payout_ledger'
  AND checksum = '5b045a6e1063b40c24fb56deef1489985a9e3b384f5731df61ab2283455c04e7'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;
```

### Step 3 — Non-allowlisted outlet_registry checksum (clone first)

Historical body edit (`0841b48e`) changed unique index DDL; follow-up migration `20260608140000_provider_outlets_outlet_key_nonunique` already exists. Update checksum to current repo hash **only after** confirming production already has non-unique `outlet_key` behaviour (index name/`UNIQUE` state).

```sql
-- Preconditions (read-only checks):
--   \d provider_outlets
--   Confirm no UNIQUE constraint on outlet_key (or unique index already dropped).

UPDATE "_prisma_migrations" SET checksum = '44fe25d3aeedb5b4691fbbf16abe62d16a4fb4cd5109c5cb0a21e36ab6234582'
WHERE migration_name = '20260608130000_ndis_provider_outlet_registry'
  AND checksum = 'f388539d957f487d9d4f4deb9e38ec6e4202bf9e775082bd49e7dfaef799298a'
  AND finished_at IS NOT NULL AND rolled_back_at IS NULL;
```

Optional follow-up (separate PR): add this path to `scripts/ci/allowed-migration-repairs.json` for archaeology — **not required** to complete A-continue if checksum is updated.

### Step 4 — Orphan production-only migration names

Rows whose folders are gone from the repo (`go_live_roadmap`, `abilitypay_mvp`, `donations`, etc.) will keep showing as “extra” in the compare helper. Options (owner chooses; do **not** drop schema objects):

| Option             | Action                                                | Risk                                                                                                              |
| ------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Keep** (default) | Leave finished rows; document as prod-only history    | Compare helper stays non-aligned on `onlyInExport`; `migrate deploy` still OK if checksums for shared names match |
| **Baseline note**  | Record in ops ledger that prod history ⊃ repo history | Low                                                                                                               |
| **Dangerous**      | `DELETE` those `_prisma_migrations` rows              | Only if you accept Prisma may try to recreate missing folders later — **not recommended**                         |

A-continue recommendation: **keep** orphan finished rows; do not delete them.

### Step 5 — Verify on clone

```bash
# From repo tip that matches the hashes above:
pnpm exec prisma migrate status
# Expect: no “modified” checksum warnings for repaired names.
# Pending migrations listed = the Jul 16+ folders not yet on prod (expected).

pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts \
  --exported ./path/to/clone-export.json
# onlyInExport may still list orphan names — acceptable under Step 4 Keep.
# checksumMismatches must be [].
# onlyInRepo should be the not-yet-deployed forward migrations (or empty after deploy).
```

### Step 6 — Production (after successful clone rehearsal)

1. Neon PITR / snapshot on `production`.
2. Re-run Steps 1–3 SQL **exactly** (same predicates).
3. `prisma migrate status` against production.
4. Record evidence: export JSON + status output (redact URLs) into the release ledger.
5. **Separate decision** before applying the 12 forward migrations (`indoor_accessibility_platform` … `at_continuity_wave1`) — out of scope for checksum reconciliation; keep AT Continuity flags off until programme approval.

---

## 4. Rollback

If a checksum `UPDATE` was wrong:

```sql
-- Example rollback for access_phase_1 only — restore pre-repair hash from snapshot notes
UPDATE "_prisma_migrations"
SET checksum = '52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d'
WHERE migration_name = '20260525000000_mapable_access_phase_1'
  AND checksum = '4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357';
```

Prefer Neon branch restore / PITR over piecemeal undo if multiple statements were applied.

Rename rollback: rename `20260525010000_ndis_direct_claiming` back to `20260525000000_ndis_direct_claiming` only if rolling back the repo folder rename as well (not planned under A-continue).

---

## 5. Status board

| Item                                                   | Status                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Strategy decision A-continue                           | `VERIFIED` (human approved)                                                                                            |
| Fresh prod `_prisma_migrations` export                 | `VERIFIED` (2026-07-25)                                                                                                |
| Staging clone rehearsal                                | **`VERIFIED`** on Neon branch `wave1-migration-rehearsal` (`br-odd-flower-a79knhk5`, parent `production`) — 2026-07-25 |
| Prod rename + checksum SQL                             | **`VERIFIED`** applied to Neon `production` (`br-rough-bush-a7mlsbdx`) — 2026-07-25 after explicit owner approval      |
| Forward `migrate deploy` of Jul 16+ migrations on prod | `NOT_RUN` — **held** (separate release decision)                                                                       |
| Migration SQL edits in this workstream                 | **None** (honoured)                                                                                                    |

### 5.1 Rehearsal evidence (clone only)

Branch: `wave1-migration-rehearsal` / `br-odd-flower-a79knhk5`  
Parent: `production` / `br-rough-bush-a7mlsbdx`  
Precondition: `provider_outlets_outlet_key_idx` is non-unique `CREATE INDEX` (not UNIQUE).

After §3 SQL on the clone:

- Rename: single finished row `20260525010000_ndis_direct_claiming` (old name gone; unfinished attempt deleted).
- All 9 allowlisted repair checksums + `ndis_provider_outlet_registry` match repo file hashes.
- `pnpm exec prisma migrate status` against the clone: **no modified-checksum / failed-migration warnings**.
- Expected remaining differences only:
  - **12** not-yet-applied repo migrations (`20260716120000_…` … `20260720120000_at_continuity_wave1`) — **do not deploy in this pack**
  - **5** DB-only orphan names (`go_live_roadmap`, `donations`, `provider_outlet_classifications`, `abilitypay_mvp`, `access_marker_feedback`) — keep per Step 4

### 5.2 Production apply evidence

**Approved phrase:** `yes, apply §3 SQL to Neon production`  
**Target:** Neon `mapableau` / `production` / `br-rough-bush-a7mlsbdx`  
**Scope:** `_prisma_migrations` bookkeeping only (rename + checksum `UPDATE`/`DELETE`). No DDL. No `migrate deploy`.

Post-apply verification:

- Rename resolved: finished `20260525010000_ndis_direct_claiming` only; old `20260525000000_ndis_direct_claiming` gone.
- `access_phase_1` checksum now `4e6d7d1f…` (was `52ecc3b7…`).
- Compare helper: **`checksumMismatches: []`** against [artifacts/production-prisma-migrations-finished-post-a-continue-2026-07-25.json](./artifacts/production-prisma-migrations-finished-post-a-continue-2026-07-25.json).
- `prisma migrate status` (redacted): [artifacts/production-migrate-status-after-a-continue-2026-07-25.txt](./artifacts/production-migrate-status-after-a-continue-2026-07-25.txt) — no modified-checksum language; 12 pending Jul 16+ migrations still held; 5 orphan DB-only names retained.

---

## 6. Related

- [WAVE1_MIGRATION_AUDIT.md](./WAVE1_MIGRATION_AUDIT.md) — Phase 1 audit + decision
- [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md) — original allowlist / repair narrative
- [OWNER_ACTION_REQUIRED_OPS.md](./OWNER_ACTION_REQUIRED_OPS.md) — broader owner pack (section D)
- `scripts/ci/compare-prisma-migrations-readonly.ts` — offline compare helper
