# Production migration reconciliation runbook

**Status:** `OWNER_ACTION_REQUIRED` for production steps — agent does not execute  
**Related:** [MIGRATE_FROM_ZERO_REPAIR.md](../remediation/MIGRATE_FROM_ZERO_REPAIR.md)

## What empty-DB green proves

`prisma migrate deploy` on disposable PostgreSQL proves repository history can apply from zero. It does **not** prove production `_prisma_migrations` matches repository file checksums.

## Procedure (human / DBA)

1. Snapshot / PITR on production and create a **staging clone**.
2. On the clone only:
   - List `_prisma_migrations` names, checksums, `finished_at`, `applied_steps_count`.
   - Compare to `prisma/migrations/*/migration.sql` file hashes.
   - Identify rename drift (example: `ndis_direct_claiming` timestamp mismatch).
3. Rehearse any checksum `UPDATE` on the clone; never auto-execute repair SQL.
4. Confirm `prisma migrate status` on the clone.
5. Obtain written account-owner approval.
6. Apply the same checksum updates on production only when schema objects already exist and SQL must **not** re-run.
7. Record evidence location + date in [PRODUCTION_READINESS_EVIDENCE_LEDGER.md](../remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md).

## Never

- `prisma db push` against shared/production
- Silent checksum edits without snapshot notes
- Treating CI migrate-from-zero green as production reconciliation
