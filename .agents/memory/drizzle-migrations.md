---
name: Drizzle migrations broken
description: Why drizzle-kit generate fails here and how to add DB schema changes
---

`npx drizzle-kit generate` fails with `SyntaxError: Unexpected token ']' ... is not valid JSON`
because a snapshot in `migrations/meta/` is malformed and the journal is inconsistent
(there are two conflicting `0007_*` migration files).

**Why:** the migrations folder is partly hand-maintained, so drizzle's meta journal drifted
out of sync with the actual SQL files. `drizzle-kit generate` validates every snapshot and
aborts on the bad one.

**How to apply:** the project's primary DB method is `npx drizzle-kit push` (see replit.md).
For new-environment portability, also hand-write an idempotent numbered SQL file in
`migrations/` (e.g. `0009_geo_platform.sql`): wrap enum creates in
`DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`, use
`CREATE TABLE IF NOT EXISTS`, and keep DDL aligned with `shared/schema/*` exactly —
do NOT add indexes that aren't in the schema, or `push` will try to drop them (drift).
Validate by running the file with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <file>`.
