# Connect MapAble to Neon

MapAble uses Prisma with PostgreSQL. [Neon](https://neon.tech) is a supported host for development and production.

## 1. Create a Neon project

1. Sign in at [https://console.neon.tech](https://console.neon.tech)
2. Create a project (e.g. `mapable-dev`)
3. Open **Dashboard → Connect** and copy the connection strings

You need **two** URLs:

| Variable       | Neon dashboard                                      | Use                                                   |
| -------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL` | **Pooled** connection (hostname contains `-pooler`) | Next.js app at runtime                                |
| `DIRECT_URL`   | **Direct** connection (no `-pooler`)                | `prisma migrate`, `seed` (never production `db push`) |

Add `?sslmode=require` if it is not already in the string.

## 2. Configure `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://...@ep-xxxx-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxxx....neon.tech/neondb?sslmode=require"
```

Keep `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and other vars from `.env.example`.

**Local Postgres:** set `DIRECT_URL` to the same value as `DATABASE_URL`.

## 3. Apply schema and seed

```bash
npx prisma migrate deploy
npx prisma generate
pnpm prisma db seed
```

Use `pnpm db:migrate:dev` when creating new migrations locally. **Do not** use `prisma db push` against production or shared environments with real participant data. Migrations use `DIRECT_URL`. The running app uses `DATABASE_URL` (pooled on Neon).

## 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000/core](http://localhost:3000/core) after the server shows **Ready**.

## MapAble Neon project (this repo)

|                    |                                     |
| ------------------ | ----------------------------------- |
| **Neon project**   | `mapableau` (`cold-paper-45965334`) |
| **Region**         | `aws-ap-southeast-2`                |
| **Default branch** | `production`                        |
| **Database**       | `neondb`                            |

Refresh local `.env` from a pooled connection string (Neon console or Cursor Neon MCP → `get_connection_string`):

```bash
cp .env.example .env
python3 scripts/configure-neon-env.py 'postgresql://USER:PASS@ep-xxx-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'
```

Verify connectivity:

```bash
set -a && source .env && set +a
npx prisma migrate status
```

## Vercel (`mapableau-new`)

The Vercel project is linked to GitHub `ausdisau/mapableau-new`. Add these **Environment Variables** in [Vercel → mapableau-new → Settings → Environment Variables](https://vercel.com/map-able/mapableau-new/settings/environment-variables) for **Production**, **Preview**, and **Development**:

### Required (database + auth)

| Name              | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Neon **pooled** URL (`-pooler` in hostname)                                                                    |
| `DIRECT_URL`      | Neon **direct** URL (no `-pooler`)                                                                             |
| `NEXTAUTH_SECRET` | Random secret (same as local `.env`)                                                                           |
| `NEXTAUTH_URL`    | Production: `https://www.mapable.com.au` (or your canonical host); Preview: leave unset or use the preview URL |

Copy database values from your local `.env` (do not commit `.env`). Alternatively, install the [Neon Vercel integration](https://vercel.com/marketplace/neon) on the project — it can provision `DATABASE_URL` automatically.

### Transport + TfNSW (optional — server-side only)

| Name                               | Recommended (prod)       | Notes                                            |
| ---------------------------------- | ------------------------ | ------------------------------------------------ |
| `TRANSPORT_ROUTING_ENABLED`        | `true`                   | Route planning                                   |
| `TRANSPORT_ROUTING_PROVIDER`       | `mock` or `osrm`         | Use `mock` unless OSRM/GraphHopper is configured |
| `TFNSW_API_KEY`                    | Your TfNSW Open Data key | Required for live traffic / trip planner APIs    |
| `TFNSW_LIVE_TRAFFIC_ENABLED`       | `true`                   | Incidents, cameras, roadwork                     |
| `TFNSW_TRIP_PLANNER_ENABLED`       | `true`                   | Public transport trip planning                   |
| `TFNSW_ENRICH_ROUTE_ESTIMATES`     | `false`                  | Set `true` only when `TFNSW_API_KEY` is set      |
| `TRANSPORT_BOOKING_BRIDGE_ENABLED` | `false`                  | Phase 1: keep off until NDIS bridge is validated |
| `TRANSPORT_RIDE_POOLING_ENABLED`   | `false`                  | Phase 2 ride runs — enable after migration + QA  |

See `.env.example`, `docs/tfnsw-traffic.md`, and `docs/accessible-ride-share.md` for the full list.

### Deploy checklist

1. **Push** a branch or merge to `main` — Vercel Git integration builds with **pnpm** (from `packageManager` in `package.json`).
2. **Apply migrations** on the production Neon branch after deploy (Vercel does not run migrations automatically):

   ```bash
   DIRECT_URL="postgresql://..." npx prisma migrate deploy
   ```

   Latest transport migration: `prisma/migrations/20260527210000_accessible_ride_share/`.

3. **Redeploy** after saving env vars so serverless functions pick up new values.

Preview deployments are created automatically for pull requests against `main`.

## Cursor + Neon MCP (optional)

In Cursor, enable the **Neon** MCP server and complete authentication. Then you can list projects and connection details from the IDE without leaving the editor.

## Troubleshooting

| Error                                          | Fix                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Environment variable not found: DATABASE_URL` | Create `.env` from `.env.example`                                                                                                                                                         |
| `Environment variable not found: DIRECT_URL`   | Set `DIRECT_URL` (copy direct Neon URL, or duplicate `DATABASE_URL` locally)                                                                                                              |
| `Can't reach database server`                  | Wrong URL, project paused, or IP allowlist — resume project in Neon console                                                                                                               |
| `P1001` / timeout under load                   | Use **pooled** `DATABASE_URL` for the app, not the direct URL                                                                                                                             |
| Migration / push errors                        | Use **direct** `DIRECT_URL`, not the pooler host                                                                                                                                          |
| `migrate status` shows divergent histories     | Neon may have been migrated from another branch/repo; use `prisma migrate deploy` after baselining, or a fresh Neon branch for dev — avoid `--force-reset` on production without a backup |

## Security

- Never commit `.env` or paste production passwords into git
- Use Neon **roles** and separate branches for dev vs production when possible
