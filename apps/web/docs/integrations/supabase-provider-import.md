# Supabase provider outlets import

NDIS provider/outlet records from `public/data/provider-outlets.json` (~77k rows) can be stored in Supabase Postgres table `public.provider_outlets` for search, realtime, and agent APIs.

## Prerequisites

1. A Supabase project (or Postgres with the same migration applied).
2. Authenticate the **Supabase MCP** server in Cursor if you want agents to run SQL via MCP (`https://mcp.supabase.com/mcp`).
3. Environment variables (server-only):

```env
SUPABASE_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
# Optional alias used by the import script:
SUPABASE_URL=https://<project-ref>.supabase.co
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*` variables.

## Apply schema

**Option A — Supabase CLI** (linked project):

```bash
supabase link --project-ref <ref>
supabase db push
```

**Option B — Direct SQL** (any Postgres, including Supabase connection string):

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260604120000_provider_outlets.sql
```

Migration file: `supabase/migrations/20260604120000_provider_outlets.sql`

### Security

- Row Level Security is enabled on `provider_outlets`.
- `anon` and `authenticated` roles may **SELECT** only rows where `active = true`.
- The import script uses the **service role**, which bypasses RLS for upserts.

## Import data

Dry-run (no writes):

```bash
pnpm import:provider-outlets-supabase -- --dry-run --limit 5
```

Full import (batched upserts, ~77k rows):

```bash
pnpm import:provider-outlets-supabase
```

Options:

| Flag | Description |
|------|-------------|
| `--limit N` | Import first N records only |
| `--dry-run` | Print a sample mapped row |
| `--batch N` | Upsert batch size (default 200, max 500) |

## Verify

In Supabase SQL editor or MCP `execute_sql`:

```sql
SELECT COUNT(*) AS total FROM public.provider_outlets;
SELECT COUNT(*) AS active FROM public.provider_outlets WHERE active = true;
SELECT id, name, state, active FROM public.provider_outlets LIMIT 5;
```

## Related tables

| Table | Purpose |
|-------|---------|
| `provider_outlets` | Full NDIS outlet registry (this import) |
| `provider_profiles` | Slim autocomplete rows (Prisma / `seed-search-autocomplete.ts`) |
| `Provider` (Prisma) | In-app organisation accounts, not the NDIS registry |

The provider finder UI still loads static JSON by default (`lib/provider-outlets.ts`). Pointing the finder at Supabase is a separate integration step.

## MCP authentication

If Supabase tools are unavailable (`needsAuth`), complete OAuth in the Cursor desktop IDE for the Supabase MCP server, then retry migrations or SQL from the agent.
