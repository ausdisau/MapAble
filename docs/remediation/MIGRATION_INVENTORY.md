# Remediation — Migration Inventory

**Inspected base:** `5c667983`  
**FindingStatus:** timestamps and folder names `verified` by listing `prisma/migrations/`.

## Summary

| Item                               | Value                                                             | Status                                                 |
| ---------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Migration directories              | 48                                                                | verified                                               |
| Lock file                          | `prisma/migrations/migration_lock.toml` (postgresql)              | verified                                               |
| Duplicate timestamps at inspection | `20260525000000` (two folders)                                    | verified                                               |
| Production instruction             | use `prisma migrate deploy`; never `prisma db push` in production | verified in ops docs; phase docs still mention db push |

## Ordered inventory (after PR 1 repair)

Timestamps must be unique. PR 1 renames the NDIS claiming migration folder to restore uniqueness. **SQL file contents are not rewritten** (historical migration immutability for statement bodies).

| Timestamp      | Folder                                  | Notes                                                          | Status                    |
| -------------- | --------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| 20260115224328 | `init`                                  | Baseline                                                       | verified                  |
| 20260115225133 | `add_session`                           |                                                                | verified                  |
| 20260115231001 | `adding_password_hash_field_to_user`    |                                                                | verified                  |
| 20260311093206 | `add_provider_models`                   |                                                                | verified                  |
| 20260311094351 | `add_worker_models`                     |                                                                | verified                  |
| 20260311095018 | `add_worker_provider_connection_models` |                                                                | verified                  |
| 20260311095603 | `add_provider_membership_models`        |                                                                | verified                  |
| 20260315053440 | `add_provider_abn_business_type`        |                                                                | verified                  |
| 20260315060000 | `add_provider_rating_review_count`      |                                                                | verified                  |
| 20260315070000 | `add_service_description_icon`          |                                                                | verified                  |
| 20260315080000 | `remove_service_icon`                   |                                                                | verified                  |
| 20260315090000 | `add_provider_service_areas`            |                                                                | verified                  |
| 20260315100000 | `add_provider_specialisations`          |                                                                | verified                  |
| 20260328070108 | `make_name_required_migration`          |                                                                | verified                  |
| 20260521000000 | `mapable_core_phase_1`                  |                                                                | verified                  |
| 20260521120000 | `mapable_core_phase_2`                  |                                                                | verified                  |
| 20260521180000 | `mapable_core_phase_3`                  |                                                                | verified                  |
| 20260521200000 | `mapable_core_phase_4`                  |                                                                | verified                  |
| 20260522000000 | `mapable_core_phase_5`                  |                                                                | verified                  |
| 20260525000000 | `mapable_access_phase_1`                | Kept                                                           | verified                  |
| 20260525010000 | `ndis_direct_claiming`                  | **Renamed in PR 1** from `20260525000000_ndis_direct_claiming` | already_remediated (PR 1) |
| 20260525120000 | `mapable_care_mvp`                      |                                                                | verified                  |
| 20260527120000 | `transport_scheduling_routing`          |                                                                | verified                  |
| 20260527210000 | `accessible_ride_share`                 |                                                                | verified                  |
| 20260530120000 | `platform_provider_patterns`            |                                                                | verified                  |
| 20260601000000 | `mapable_core_phase_6`                  |                                                                | verified                  |
| 20260602000000 | `mapable_core_phase_7`                  |                                                                | verified                  |
| 20260603000000 | `mapable_core_phase_8`                  |                                                                | verified                  |
| 20260603110000 | `passkey_credentials`                   |                                                                | verified                  |
| 20260603120000 | `y1_wedge`                              |                                                                | verified                  |
| 20260603140000 | `y2_orchestration`                      |                                                                | verified                  |
| 20260604000000 | `mapable_core_phase_9`                  |                                                                | verified                  |
| 20260604120000 | `engagement_platform`                   |                                                                | verified                  |
| 20260604140000 | `y3_national_trust`                     |                                                                | verified                  |
| 20260605000000 | `mapable_core_phase_10`                 |                                                                | verified                  |
| 20260605140000 | `y4_civic_platform`                     |                                                                | verified                  |
| 20260606000000 | `mapable_core_phase_12`                 |                                                                | verified                  |
| 20260606140000 | `y5_rights_infrastructure`              |                                                                | verified                  |
| 20260607000000 | `case_management`                       |                                                                | verified                  |
| 20260607120000 | `ndis_service_delivery_mechanism`       |                                                                | verified                  |
| 20260608130000 | `ndis_provider_outlet_registry`         |                                                                | verified                  |
| 20260608140000 | `provider_outlets_outlet_key_nonunique` |                                                                | verified                  |
| 20260609120000 | `ndis_provider_ingestion`               |                                                                | verified                  |
| 20260610120000 | `worker_organisation_invites`           |                                                                | verified                  |
| 20260611120000 | `integration_type_search`               |                                                                | verified                  |
| 20260626120000 | `payout_ledger`                         |                                                                | verified                  |
| 20260716120000 | `indoor_accessibility_platform`         |                                                                | verified                  |
| 20260717020000 | `billing_centre_foundations`            |                                                                | verified                  |

## PR 1 rename procedure and rollback

**Change:**  
`prisma/migrations/20260525000000_ndis_direct_claiming`  
→ `prisma/migrations/20260525010000_ndis_direct_claiming`

**Rationale:** Prisma orders migrations by folder timestamp prefix. Duplicate prefixes make apply order non-deterministic.

**Rollback:** rename folder back only if a deployment has already recorded the old name in `_prisma_migrations` and cannot be resolved. Prefer:

1. Inspect `_prisma_migrations` for `20260525000000_ndis_direct_claiming` vs `20260525010000_ndis_direct_claiming`
2. If old name applied and new name missing: `prisma migrate resolve` per Neon/ops runbook — **do not** re-run SQL
3. Status of deployed DBs: `needs_runtime_verification`

## CI enforcement

- `scripts/ci/check-migration-order.ts` — monotonic unique timestamps
- `scripts/ci/check-migration-integrity.ts` — no duplicates; rejects production runbook `db push`; detects edited historical migrations via git history when `BASE_SHA` set

## Stub migrations blocking migrate-from-zero

Several MapAble Core phase folders are **documentation stubs** (comments only, or minimal DDL) that historically assumed `prisma db push`. Status: `verified`.

Examples: `mapable_core_phase_3`–`5`, `mapable_care_mvp`, `mapable_core_phase_6`–`10`, `mapable_core_phase_12`, `case_management`.

**CI policy (updated 2026-07-20):**

- Required **Migrations** job: order + integrity + ephemeral schema coherence via CI-only `db push`
- **Migrate from zero** job: hard-fails on `prisma migrate deploy` from empty DB (no `continue-on-error`, no masked `exit 0`)
- First failing migration: `20260525000000_mapable_access_phase_1` (missing `);` before `CREATE INDEX`) — see `MIGRATE_FROM_ZERO_BLOCKER.md`
- SQL rewrite deferred until account-owner provides `_prisma_migrations` evidence
- Production remains `prisma migrate deploy` only — never `db push`

## Approved historical repairs

See `scripts/ci/allowed-migration-repairs.json`. PR 1 repairs `20260521120000_mapable_core_phase_2` to create `ProviderResponseStatus` before use.

## Policy going forward

- Additive migrations only before deprecating legacy structures
- Never edit historical `migration.sql` bodies except via allowlisted remediation repairs
- Never instruct `prisma db push` for production
