# Remediation artefacts

Redacted evidence files only (no connection strings, tokens, or PII).

| File | Description |
| ---- | ----------- |
| `production-prisma-migrations-2026-07-25.json` | Full Neon `mapableau` / `production` export (includes unfinished/rolled rows). |
| `production-prisma-migrations-finished-2026-07-25.json` | Finished, non-rolled rows only — input for the compare helper. |

```bash
pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts \
  --exported docs/remediation/artifacts/production-prisma-migrations-finished-2026-07-25.json
```
