# Remediation artefacts

Redacted evidence files only (no connection strings, tokens, or PII).

| File | Description |
| ---- | ----------- |
| `production-prisma-migrations-2026-07-25.json` | Pre–A-continue full export (includes unfinished/rolled rows). |
| `production-prisma-migrations-finished-2026-07-25.json` | Pre–A-continue finished rows (drift baseline). |
| `production-prisma-migrations-finished-post-a-continue-2026-07-25.json` | Post–§3 production finished rows — checksums aligned with repo. |
| `production-migrate-status-after-a-continue-2026-07-25.txt` | Redacted `prisma migrate status` after production §3 apply. |

```bash
pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts \
  --exported docs/remediation/artifacts/production-prisma-migrations-finished-post-a-continue-2026-07-25.json
# Expect checksumMismatches: []; onlyInRepo = Jul 16+ pending; onlyInExport = orphan prod-only names.
```
