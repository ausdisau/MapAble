# Staging migration rehearsal (owner pack)

**Status:** procedure documented; live rehearsal `NOT_RUN` / `OWNER_ACTION_REQUIRED`  
**Safety:** no production credentials; no `prisma db push` on shared DBs; no writes to production `_prisma_migrations`.

## Goal

Reconcile repository migration history with a **Neon staging clone** (snapshot/PITR protected) before any production migration discussion.

## Owner procedure

1. Create/refresh a Neon **staging clone** from production (owner console).
2. Enable snapshot / confirm PITR window; record snapshot id.
3. Export staging `_prisma_migrations` as JSON with only:
   - `migration_name`
   - `checksum`
4. Redact connection strings from all artefacts.
5. Run locally (agent/CI may inventory without export):

```bash
pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts
pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts \
  --exported ./artifacts/staging-prisma-migrations.redacted.json
```

6. Record pass/fail in the evidence form below.
7. Application smoke on staging clone only.
8. Do **not** merge Wave 1 (#382) based on empty-DB CI alone — production checksum reconciliation remains `OWNER_ACTION_REQUIRED`.

## Evidence form (`NOT_RUN` until filled)

| Field                                         | Value                   |
| --------------------------------------------- | ----------------------- |
| Operator                                      |                         |
| Date                                          |                         |
| Neon staging project / branch id (no secrets) |                         |
| Snapshot / PITR reference                     |                         |
| Export artefact path (redacted)               |                         |
| Compare exit code                             |                         |
| onlyInRepo                                    |                         |
| onlyInExport                                  |                         |
| checksumMismatches                            |                         |
| App smoke result                              |                         |
| Overall                                       | PASS / FAIL / `NOT_RUN` |

## Related

- `docs/operations/MIGRATION_RECONCILIATION.md`
- `docs/operations/BACKUP_RESTORE.md`
- PR #382 remains draft until human preview + owner migration evidence
