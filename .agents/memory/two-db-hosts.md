---
name: Two Postgres hosts — app uses NEON_DATABASE_URL
description: DATABASE_URL and NEON_DATABASE_URL point to DIFFERENT databases; the app reads Neon.
---
The repl has two distinct Postgres connection strings pointing at **different** servers:
- `DATABASE_URL` → a local/replit-managed host (e.g. `helium`)
- `NEON_DATABASE_URL` → the Neon serverless host (`*.neon.tech`)

`server/db.ts` and `drizzle.config.ts` resolve `process.env.NEON_DATABASE_URL || process.env.DATABASE_URL`, so **the app's real data lives in Neon**.

**Why:** Running `psql "$DATABASE_URL" ...` queries/migrates the WRONG (empty) database and gives false "0 rows" / "table missing" results.
**How to apply:** For any manual psql query, migration apply, or data backfill that must match what the app sees, always use `psql "$NEON_DATABASE_URL"`.
