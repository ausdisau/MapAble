# MapAble production infrastructure runbook

This runbook captures the production baseline for the current MapAble web app.
It is Vercel-first, with documented fallback hosts if Vercel billing or domain
access blocks deployment.

## Current hosting status

- Primary target: Vercel.
- **Canonical public host:** `https://mapable.com.au` (apex).
- `www.mapable.com.au` should redirect to apex (account-owner DNS/TLS). Verified
  2026-07-20 edge scan: www returned `307` to apex.
- Deploy/env gate requires exact apex origins for `NEXTAUTH_URL` /
  `NEXT_PUBLIC_APP_URL` (rejects www, localhost, HTTP, paths, ports).
- Non-Vercel production hosts must set `MAPABLE_ENFORCE_PRODUCTION_ENV=true`.

Do not treat a successful local build as production deployment proof until a
production deployment URL is verified with the smoke checks below.

## Required production environment variables

| Variable                                               | Required                      | Notes                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                         | Yes                           | Pooled Neon/Postgres URL for runtime Prisma queries.                                                                                          |
| `DIRECT_URL`                                           | Yes                           | Direct Neon/Postgres URL for migrations. Do not use the pooler host.                                                                          |
| `NEXTAUTH_SECRET`                                      | Yes                           | Canonical signing secret (≥16). Deploy gate does not accept AUTH_SECRET/SESSION_SECRET aliases.                                              |
| `NEXTAUTH_URL`                                         | Yes                           | Exactly `https://mapable.com.au` (optional trailing `/`).                                                                                    |
| `NEXT_PUBLIC_APP_URL`                                  | Yes                           | Exactly `https://mapable.com.au` (must match NEXTAUTH_URL origin).                                                                           |
| `MAPABLE_ENFORCE_PRODUCTION_ENV`                       | Non-Vercel prod               | Set `true` so next.config + instrumentation run the production env gate.                                                                    |
| `NDIS_ENCRYPTION_KEY`                                  | Recommended                   | Separate stable secret for encrypted NDIS identifiers.                                                                                        |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`             | If email enabled              | Required for production email delivery.                                                                                                       |
| `DOCUMENT_STORAGE_MODE`                                | Yes                           | Use a production-safe mode once document upload workflows are live.                                                                           |
| `AI_GATEWAY_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` | If search interpreter enabled | Required for natural-language provider search.                                                                                                |
| `POSTHOG_API_KEY` / `POSTHOG_HOST`                     | If analytics enabled          | Required for LLM analytics capture.                                                                                                           |

## Deployment sequence

1. Confirm the Vercel team subscription is active.
2. Confirm the Vercel project that owns `mapable.com.au` is accessible.
3. Confirm domain assignment:

   ```bash
   vercel domains inspect mapable.com.au --scope <team>
   vercel domains inspect www.mapable.com.au --scope <team>
   ```

4. Confirm project link or link explicitly:

   ```bash
   test -f .vercel/project.json && echo "Linked" || vercel link
   ```

5. Configure production env vars in Vercel.
6. Run local verification:

   ```bash
   pnpm setup:cloud-agent
   pnpm type-check
   pnpm build
   ```

7. Deploy:

   ```bash
   vercel deploy --prod --yes --scope <team>
   ```

8. Smoke-check production:

   ```bash
   curl -I https://mapable.com.au/
   curl -I https://www.mapable.com.au/
   curl -sS https://mapable.com.au/api/health/live
   curl -sS https://mapable.com.au/api/health/ready
   curl https://mapable.com.au/api/auth/session
   curl https://mapable.com.au/api/auth/providers
   curl -I https://mapable.com.au/robots.txt
   curl -I https://mapable.com.au/sitemap.xml
   curl -I https://mapable.com.au/jobs
   ```

## Database and migrations

- Runtime app uses `DATABASE_URL`.
- Migration commands use `DIRECT_URL`.
- Production migrations must be reviewed before deploy:

  ```bash
  DIRECT_URL="postgresql://..." pnpm exec prisma migrate deploy
  ```

- Do not run `prisma db push` against production.
- Do not reset production branches without a verified backup.

## Rollback

Vercel rollback should be done by promoting the last known-good deployment in
the Vercel dashboard or CLI. If a schema migration caused the issue, treat
rollback as a data migration incident and verify whether the schema can safely
roll backward before promoting older code.

## Ownership checklist

- Production Vercel project owner confirmed.
- Billing active.
- Domain access confirmed.
- Production env vars set.
- Neon branch and backup owner confirmed.
- Auth smoke checks pass.
- SEO routes return 200.
- Monitoring owner confirmed.
