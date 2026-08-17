# Neon: Prisma migrations vs schema

## Symptoms

- `npx prisma migrate deploy` fails with **P3005** (“database schema is not empty”) when `_prisma_migrations` is missing or out of sync with `prisma/migrations/`.
- `npx prisma migrate status` lists all repo migrations as **not applied** while the DB already has many tables (partial legacy schema).
- Post-login **500** on `/dashboard` when Prisma queries tables that exist in `schema.prisma` but not in Neon (e.g. `IncidentReport`, `transport_trips`, `SupportTicket`).

## Diagnose

```bash
npx tsx scripts/check-neon-migrations.ts
```

This reports public table count, key table presence, `_prisma_migrations` stats, and repo vs DB migration name drift.

Ensure `.env` `DATABASE_URL` / `DIRECT_URL` point at the intended Neon branch (production vs preview). The Neon MCP default branch may differ from your local `.env` endpoint.

## Historical note (May 2026 — do not repeat)

On branch `ep-old-wildflower`, an empty/partial Neon schema was once aligned with a destructive schema sync and then baselined into `_prisma_migrations` via `prisma migrate resolve --applied`. **That path is not an approved production procedure.**

Going forward:

1. Prefer empty-database `prisma migrate deploy` from zero, or official [baselining](https://www.prisma.io/docs/guides/migrate/developing-with-existing-db) without data loss.
2. **Never** run `prisma db push` (with or without `--accept-data-loss`) against production or any environment with real participant data.
3. **Verify:**
   ```bash
   npx prisma migrate deploy   # expect: No pending migrations to apply
   npx prisma migrate status   # expect: Database schema is up to date
   ```

## Recreate dev users after a destructive sync

```bash
npx tsx scripts/ensure-mapable-user.ts \
  --email jonathan.shar@hotmail.com \
  --name "Jonathan Shar" \
  --reset-password
```

Default password from the script: `Password123!` (only for local/dev; change in production).

## Ongoing workflow

- **New environments:** prefer `prisma migrate deploy` on empty DBs, or official [baselining](https://www.prisma.io/docs/guides/migrate/developing-with-existing-db) if importing an existing database.
- **Do not** rely on `db push` for production if you need migration history and zero data loss; use `migrate deploy` and resolve failed rows in `_prisma_migrations` instead.
- If `_prisma_migrations` shows **finished** migrations but tables are missing, treat as drift: use `migrate diff` (DB → schema) and apply only the missing `CREATE` statements, or re-baseline after a planned maintenance window.
