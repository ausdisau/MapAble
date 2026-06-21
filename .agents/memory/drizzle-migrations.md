---
name: Drizzle migrations broken
description: Why drizzle-kit generate fails here and how to add DB schema changes
---

`npx drizzle-kit generate` fails because `migrations/meta/` only has snapshots for
0000–0002 (the rest were hand-written, never snapshotted). `generate` validates every
snapshot/diff and aborts. Do NOT try to fix `generate` — it is not the project's path.

**Why:** the migrations folder is hand-maintained and the DB is built with
`drizzle-kit push` (schema-diff), not `drizzle-kit migrate`. There is no
`drizzle.__drizzle_migrations` tracking table, so the journal/SQL files are a
historical ledger, never actually replayed.

**Journal must stay a complete manifest:** `migrations/meta/_journal.json` is the
ordered ledger; keep it 1:1 with the SQL files. **Rule:** when adding a migration,
add both the next-numbered idempotent SQL file AND a matching `_journal.json` entry
(contiguous idx, strictly increasing `when`, unique numeric prefix); never edit an
already-applied file's SQL, and never reuse a numeric prefix.

**How to apply a schema change:** primary method is `npx drizzle-kit push` (see
replit.md). For new-environment portability, also hand-write an idempotent numbered
SQL file: wrap enum creates in
`DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`, use
`CREATE TABLE/COLUMN IF NOT EXISTS`, and keep DDL aligned with `shared/schema/*`
exactly — do NOT add indexes that aren't in the schema, or `push` will try to drop
them (drift). Validate with `psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -f <file>`.
Avoid running `push` blindly: it currently wants to drop unrelated Provider/
ServiceLocation tables (pre-existing schema drift).
