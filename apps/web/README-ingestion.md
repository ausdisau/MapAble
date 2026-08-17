# NDIS provider ingestion

MapAble ingests the public NDIS **provider finder** static JSON export for directory search, care matching, and transport coordination. This is **not** a legal guarantee of current NDIS registration.

## Source

https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json

The NDIA may return HTTP 403 to automated clients. The ingest job falls back to a local copy when present:

- `data/ndis/list-providers.json` (from `pnpm fetch:ndis-list-providers`)
- `public/data/provider-outlets.json` (bundled snapshot)

Treat this file as a **directory input**, not a stable public API. Do not poll it frequently.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection for Prisma |
| `DIRECT_URL` | Recommended for ingest | Neon direct (non-pooler) connection for long batch writes |
| `NDIS_INGEST_BATCH_SIZE` | No | Upsert batch size (default `25`, max `100`) |
| `NDIS_PROVIDER_SOURCE_URL` | No | Override source URL (defaults to official list-providers.json) |
| `ADMIN_CRON_SECRET` | For cron / bearer | Bearer token for `POST /api/admin/ingest/ndis-providers` |
| `DRY_RUN` | No | Set to `true` to fetch and normalise without writing |
| `PGSSL` | No | Use if your Postgres provider requires SSL (document in deployment) |

Logged-in MapAble admins can also trigger ingestion from `/admin/ndis-provider-ingestion` (session cookie).

## Commands

Dry run (prints counts, sample row, raw field keys):

```bash
pnpm ingest:ndis-providers:dry
```

Apply migrations and ingest:

```bash
pnpm prisma migrate deploy
pnpm ingest:ndis-providers
```

## Cron (Vercel)

`vercel.json` schedules daily ingestion at **17:15 UTC** (`15 17 * * *`), which aligns with early morning in Australia/Sydney depending on daylight saving.

The cron calls `POST /api/admin/ingest/ndis-providers` with:

```http
Authorization: Bearer ${ADMIN_CRON_SECRET}
```

## API

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/admin/ingest/ndis-providers` | POST | Bearer `ADMIN_CRON_SECRET` or admin session |
| `/api/providers/ndis/search` | GET | Public (no raw JSON in responses) |

Search query params: `q`, `state`, `postcode`, `service`, `limit` (default 25, max 100).

## Database tables

- `ndis_provider_ingestion_runs` — run metadata, payload hash, status
- `ndis_providers` — normalised rows with `raw` JSONB preserved for reprocessing

Re-running ingestion **upserts** by `source_id`; existing rows are updated, not duplicated.

Stale providers (removed from a future export) are **not** deleted yet — see TODO in `lib/ingestion/ndis-providers.ts`.

## Data caveat

- Providers must **not** be shown as “verified by MapAble” without a future verification layer against official NDIA registration sources.
- Keep `raw` for schema drift and re-normalisation.
- Verify operational use against NDIA systems before billing or compliance decisions.

## Admin UI

`/admin/ndis-provider-ingestion` — last run status, counts, and **Run ingestion now**.
