# Wave 1 — Migration Baseline & Deploy-from-Zero Audit

**Phase:** Wave 1 Phase 1 — local audit & strategy proposal (no further migration edits in this PR)  
**Audit date (UTC):** 2026-07-25  
**Audited tip:** `cbcff88162974b2941d0f82f15e8891f694a7cdc` (`origin/main` at audit time)  
**Auditor role:** principal database / release-readiness (read-only for SQL history in this phase)  
**FindingStatus legend:** `VERIFIED` (reproduced this session) · `DOCUMENTED` (prior remediation evidence in repo) · `OWNER_ACTION_REQUIRED`

---

## 0. Executive verdict

| Question | Answer | Status |
| -------- | ------ | ------ |
| Does empty-DB `prisma migrate deploy` fail on current `main`? | **No** — **58/58** migrations applied successfully | `VERIFIED` |
| Was the historical P3018 (`access_trust_events` missing `);`) real? | **Yes** — exact defect documented below; pre-repair file sha256 `52ecc3b7…` | `VERIFIED` (defect) + `DOCUMENTED` (prod checksum match) |
| Has Option A (edit historical SQL) already been taken on `main`? | **Yes** — allowlisted repairs landed in **PR #381** (2026-07-20) | `DOCUMENTED` + re-verified green deploy |
| Do comment-only stub migrations remain? | **Yes** — 9 folders (listed in §3); they no longer block empty-DB deploy | `VERIFIED` |
| Is production `_prisma_migrations` reconciled with repaired files? | **Unknown / not proven by this session** — prior Neon notes say **drift**; owner runbook still open | `OWNER_ACTION_REQUIRED` |
| Recommended next step for Wave 1 | **Do not squash yet.** Treat empty-DB baseline as **proven on `main`**. Complete owner checksum / rename-drift reconciliation before any further history rewrite or baseline squash. | Proposal — awaiting approval |

**Operating rules for this phase (honoured):** no edits to historical `migration.sql`, no deletion of migration folders, no `prisma db push` except against the disposable local database used for proof.

---

## 1. Migration inventory (chronological)

**Count:** 58 migration directories + `migration_lock.toml` (`provider = "postgresql"`).

| # | Timestamp / folder | Class | Notes |
| - | ------------------ | ----- | ----- |
| 1 | `20260115224328_init` | DDL | Baseline |
| 2 | `20260115225133_add_session` | DDL | |
| 3 | `20260115231001_adding_password_hash_field_to_user` | DDL | |
| 4 | `20260311093206_add_provider_models` | DDL | |
| 5 | `20260311094351_add_worker_models` | DDL | |
| 6 | `20260311095018_add_worker_provider_connection_models` | DDL | |
| 7 | `20260311095603_add_provider_membership_models` | DDL | |
| 8 | `20260315053440_add_provider_abn_business_type` | DDL (tiny) | Real `ALTER` |
| 9 | `20260315060000_add_provider_rating_review_count` | DDL (tiny) | Real `ALTER` |
| 10 | `20260315070000_add_service_description_icon` | DDL (tiny) | Real `ALTER` |
| 11 | `20260315080000_remove_service_icon` | DDL (tiny) | Real `ALTER` |
| 12 | `20260315090000_add_provider_service_areas` | DDL (tiny) | Real `ALTER` |
| 13 | `20260315100000_add_provider_specialisations` | DDL (tiny) | Real `ALTER` |
| 14 | `20260328070108_make_name_required_migration` | DDL | |
| 15 | `20260521000000_mapable_core_phase_1` | DDL | |
| 16 | `20260521120000_mapable_core_phase_2` | DDL | Allowlisted repair (enum create-before-alter) |
| 17 | `20260521180000_mapable_core_phase_3` | DDL | **Was stub; bootstrapped** in #381 |
| 18 | `20260521200000_mapable_core_phase_4` | **STUB** | Comments only; mentions `db push` |
| 19 | `20260522000000_mapable_core_phase_5` | **STUB** | Comments only |
| 20 | `20260525000000_mapable_access_phase_1` | DDL | Historical P3018 site; repaired + slimmed in #381 |
| 21 | `20260525010000_ndis_direct_claiming` | DDL | Renamed from duplicate `20260525000000_…` (PR 1) |
| 22 | `20260525120000_mapable_care_mvp` | DDL | **Was stub; Incident\* DDL** in #381 |
| 23 | `20260527120000_transport_scheduling_routing` | DDL | Allowlisted `IF NOT EXISTS` enum tweaks |
| 24 | `20260527210000_accessible_ride_share` | DDL | |
| 25 | `20260530120000_platform_provider_patterns` | DDL | |
| 26 | `20260601000000_mapable_core_phase_6` | **STUB** | |
| 27 | `20260602000000_mapable_core_phase_7` | **STUB** | |
| 28 | `20260603000000_mapable_core_phase_8` | **STUB** | |
| 29 | `20260603110000_passkey_credentials` | DDL | |
| 30 | `20260603120000_y1_wedge` | DDL | Allowlisted enum tweak |
| 31 | `20260603140000_y2_orchestration` | DDL | |
| 32 | `20260604000000_mapable_core_phase_9` | **STUB** | |
| 33 | `20260604120000_engagement_platform` | DDL | Allowlisted enum tweak |
| 34 | `20260604140000_y3_national_trust` | DDL | |
| 35 | `20260605000000_mapable_core_phase_10` | **STUB** | |
| 36 | `20260605140000_y4_civic_platform` | DDL | |
| 37 | `20260606000000_mapable_core_phase_12` | **STUB** | |
| 38 | `20260606140000_y5_rights_infrastructure` | DDL | |
| 39 | `20260607000000_case_management` | **STUB** | Documents Case\* models; no DDL |
| 40 | `20260607120000_ndis_service_delivery_mechanism` | DDL | |
| 41 | `20260608130000_ndis_provider_outlet_registry` | DDL | |
| 42 | `20260608140000_provider_outlets_outlet_key_nonunique` | DDL | |
| 43 | `20260609120000_ndis_provider_ingestion` | DDL | |
| 44 | `20260610120000_worker_organisation_invites` | DDL | |
| 45 | `20260611120000_integration_type_search` | DDL | Allowlisted `CREATE TYPE` before `ADD VALUE` |
| 46 | `20260626120000_payout_ledger` | DDL | Allowlisted enum tweak |
| 47 | `20260716120000_indoor_accessibility_platform` | DDL | |
| 48 | `20260717020000_billing_centre_foundations` | DDL | Allowlisted enum tweak |
| 49–57 | `20260717100000` … `20260719120000_shared_programme_foundation` | DDL | Convergence / trust / care / AI / programmes |
| 58 | `20260720120000_at_continuity_wave1` | DDL | Present on `main` only (post–Wave 0 tip) |

Classification rule used this session: **STUB** = `migration.sql` contains no `CREATE` / `ALTER` / `DROP` / DML statement (comments only). Tiny real `ALTER`s are **not** stubs.

---

## 2. Syntax defect in `20260525000000_mapable_access_phase_1` (historical)

### 2.1 Exact failure (pre-repair file shape)

On the **broken** file (sha256 `52ecc3b73328a905db0d35028d6e3f7f22ac7d8dbfc2445c171039f96b121f2d`, ~133 885 bytes / ~4452 lines — still reachable as the parent of repair commit `a5563cd3`):

| Field | Value |
| ----- | ----- |
| Statement | `CREATE TABLE "access_trust_events" (` |
| Start line (broken file) | **4333** |
| Defect line | **4341** — `CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")` |
| Immediate next line | **4342** — `CREATE INDEX "access_places_status_idx" ON "access_places"("status");` |
| Missing token | Closing `);` after the `PRIMARY KEY` line (and a blank line / `-- CreateIndex` separator) |
| Postgres error position | Character **127592** (`syntax error at or near "CREATE"`, SQLSTATE `42601`) |
| Prisma | **P3018** — migration failed to apply |

Broken shape:

```sql
CREATE TABLE "access_trust_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
CREATE INDEX "access_places_status_idx" ON "access_places"("status");
```

Required closure (as applied in `a5563cd3`):

```sql
    CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_places_status_idx" ON "access_places"("status");
```

### 2.2 Scan for similar unclosed `CREATE TABLE` statements

- On the **broken** mega-dump: deploy stopped at this first syntax error; no second P3018 was observed in-session because apply aborted.
- On **current `main`** file (`4e6d7d1f…`, 612 lines, AccessPlace-domain only): `access_trust_events` is correctly closed; no additional unclosed `CREATE TABLE` pattern detected in that file.
- Follow-on empty-DB failures after the one-line `);` fix (duplicate `User` DDL inside the same dump) motivated the subsequent **slim** of `access_phase_1` in `f7af0265` — see [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).

### 2.3 Current file on `main` (post-#381)

```text
sha256: 4e6d7d1fc629e3e3ad7e459bcb3409f45a81086a448e859ced11336849b8d357
lines:  612
CREATE TABLE "access_trust_events" … PRIMARY KEY ("id")\n);\n\n-- CreateIndex\nCREATE INDEX "access_places_status_idx" …
```

Allowlist entry: `scripts/ci/allowed-migration-repairs.json` → path `prisma/migrations/20260525000000_mapable_access_phase_1/migration.sql`.

---

## 3. Stub / empty migrations (remaining on `main`)

These folders still contain **comment-only** SQL (no DDL). They apply as no-ops under `migrate deploy` and are recorded in `_prisma_migrations`.

| Folder | Bytes | Content theme |
| ------ | ----- | ------------- |
| `20260521200000_mapable_core_phase_4` | 106 | “see schema” + `db push` |
| `20260522000000_mapable_core_phase_5` | 106 | same |
| `20260601000000_mapable_core_phase_6` | 106 | same |
| `20260602000000_mapable_core_phase_7` | 106 | same |
| `20260603000000_mapable_core_phase_8` | 106 | same |
| `20260604000000_mapable_core_phase_9` | 106 | same |
| `20260605000000_mapable_core_phase_10` | 107 | same |
| `20260606000000_mapable_core_phase_12` | 107 | same |
| `20260607000000_case_management` | 410 | Documents Case\* models; instructs `db push` for dev |

**Formerly stubs, now real DDL (do not treat as empty):**

| Folder | Repair |
| ------ | ------ |
| `20260521180000_mapable_core_phase_3` | Bootstrap core / care dependency DDL (#381) |
| `20260525120000_mapable_care_mvp` | `Incident*` enums + `IncidentReport` (#381) |

**Not stubs (small but real DDL):** Mar 2026 Provider/Service column `ALTER`s; `integration_type_search` (now includes `CREATE TYPE` + `ADD VALUE`).

Stubs are harmless for empty-DB apply **only because** later migrations / bootstrapped phase_3 cover required objects. They remain a **trust smell** (history claims work that never ran as SQL).

---

## 4. Local deploy-from-zero proof (this session)

### 4.1 Environment

| Item | Value |
| ---- | ----- |
| Engine | PostgreSQL **16.14** (Ubuntu package; Docker unavailable in agent VM — equivalent disposable server) |
| Database | `mapable_wave1_zero` (created empty, dropped/recreated between runs) |
| URLs | `DATABASE_URL` = `DIRECT_URL` = `postgresql://postgres:***@127.0.0.1:5432/mapable_wave1_zero` |
| Command | `pnpm exec prisma migrate deploy` |
| Tip | `cbcff881` (`main`) |

### 4.2 Result on current `main` — SUCCESS

```text
58 migrations found in prisma/migrations
… (all folders applied in timestamp order) …
All migrations have been successfully applied.
PRISMA_EXIT: 1 → 0 (success)
_prisma_migrations finished rows: 58
failed / unfinished rows: 0
```

CI alignment: `.github/workflows/migrations.yml` job `Migrate from zero` runs the same command hard-fail (no `continue-on-error`); recent `main` / PR runs show **success**.

### 4.3 Reproduction of historical P3018 (control)

Against the **pre-repair** file body (sha256 `52ecc3b7…`, checked out via parent of `a5563cd3` / stale branch tip before #381):

```text
Applying migration `20260525000000_mapable_access_phase_1`
Error: P3018
Migration name: 20260525000000_mapable_access_phase_1
Database error code: 42601
ERROR: syntax error at or near "CREATE"
Position: … 4341 CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
DbError { … position: Some(Original(127592)) … }
```

Migrations **1–19** finished; `access_phase_1` left unfinished with logs (`finished_at` NULL). This matches the Wave 0 / CI investigator narrative.

### 4.4 Note on production evidence scope

This Phase 1 session **did not** open Neon or re-query live `_prisma_migrations`. Prior remediation docs ([MIGRATE_FROM_ZERO_BLOCKER.md](./MIGRATE_FROM_ZERO_BLOCKER.md), [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md)) record a 2026-07-20 Neon fetch:

- Prod checksum for `access_phase_1` matched the **broken** file (`52ecc3b7…`).
- `applied_steps_count = 0` with `finished_at` set (anomaly).
- Rename drift: prod may still list `20260525000000_ndis_direct_claiming` vs repo `20260525010000_…`.

Treat live reconciliation as **`OWNER_ACTION_REQUIRED`** until a fresh read-only export is attached to this Wave.

---

## 5. Strategy evaluation

### Option A — Fix syntax (and related empty-DB blockers) in historical files

**Already executed on `main` via PR #381** (allowlisted in `scripts/ci/allowed-migration-repairs.json`).

| Pros | Cons |
| ---- | ---- |
| Preserves chronological migration names already recorded (or expected) in deployed DBs | Changes file checksums → Prisma reports “modified migration” until `_prisma_migrations.checksum` is updated |
| Empty-DB / CI path is now green without discarding history | Requires **owner** checksum SQL per repaired finished row; must **not** re-run repaired SQL on prod |
| Incremental: only touched paths needed for deploy-from-zero | History remains noisy (stubs, enum `IF NOT EXISTS`, bootstrapped phase_3) |
| Aligns with Prisma guidance when a migration was never successfully applied as SQL | If any environment partially applied the mega-dump mid-file, reality may diverge from both old and new files — needs row-level evidence |

**When A is safe:** migration row finished with `applied_steps_count = 0` (or never applied), schema objects already match intent, and checksum is updated under snapshot/PITR + staging rehearsal.

**When A is unsafe:** unknown apply progress, no prod dump, or objects missing that the repaired file no longer creates (slimmed `access_phase_1`).

### Option B — Squash pre-launch history into a single `0_baseline` migration

| Pros | Cons |
| ---- | ---- |
| Cleanest story for **greenfield** / pre-production DBs that can be wiped | **Destructive to history** for any DB that already has 50+ `_prisma_migrations` rows |
| Removes stub noise and allowlist debt in one move | Requires coordinated reset: replace `prisma/migrations/*`, baseline from `prisma migrate diff` / `db pull`, and rewrite or replace `_prisma_migrations` on every deployed environment |
| Future `migrate deploy` is one file + forward-only deltas | High blast radius if staging/prod already diverged; easy to desync app schema vs baseline |
| Attractive if all non-disposable DBs are still disposable | Does **not** remove the need for a careful cutover plan; often harder than checksum updates once Option A already made empty-DB green |

**When B is appropriate:** confirmed pre-production (or willing wipe), single source-of-truth schema, and willingness to mark all old migrations obsolete in every environment in the same release window.

**When B is inappropriate:** production (or long-lived staging) already has applied history and real data — especially with documented checksum / rename drift.

### Recommendation (pending your approval)

1. **Accept Option A as the landed empty-DB remediation** (already on `main`). Do **not** re-edit repaired SQL in Wave 1 without new failing evidence.
2. **Defer Option B (squash)** unless product leadership explicitly chooses a wipe-and-rebaseline of all non-local databases. Empty-DB proof is already satisfied; squash would optimize archaeology, not unblock CI.
3. **Wave 1 remaining proof work** (no historical SQL edits without new allowlist + approval):
   - Fresh read-only export of production (and staging) `_prisma_migrations` (name, checksum, finished_at, applied_steps_count).
   - Staging-clone rehearsal of checksum updates from [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).
   - Owner-executed production checksum + `ndis_direct_claiming` rename-drift reconciliation.
   - Keep stubs as no-ops for now; optional later “documentation cleanup” PR is separate from baseline proof.
4. **Do not** run `prisma db push` against shared environments. Disposable local only.

---

## 6. Related artefacts

| Doc / path | Role |
| ---------- | ---- |
| [MIGRATE_FROM_ZERO_BLOCKER.md](./MIGRATE_FROM_ZERO_BLOCKER.md) | Historical P3018 record; empty-DB no longer blocked |
| [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md) | Allowlisted repairs + owner checksum runbook |
| [MIGRATION_INVENTORY.md](./MIGRATION_INVENTORY.md) | Older inventory (refresh counts: **58** on this tip) |
| `scripts/ci/allowed-migration-repairs.json` | CI integrity allowlist for edited historical SQL |
| PR [#381](https://github.com/ausdisau/mapableau-new/pull/381) | Landed migrate-from-zero green repairs |

---

## 7. Approval gate (stop here)

**This document is the Phase 1 deliverable.** No Prisma schema or `migration.sql` changes are included in this change set.

Please approve one path before Phase 2 execution:

- **A-continue:** Proceed with production/staging `_prisma_migrations` reconciliation only (recommended).
- **B-squash:** Author a wipe-safe baseline squash plan (explicit environments in scope + cutover steps).
- **A+hybrid:** Keep repaired history for deployed DBs; introduce a baseline only for brand-new environments (dual-track — higher doc/process cost).

Reply with the chosen option (and any environments that are wipe-eligible) before any further migration-file work.
