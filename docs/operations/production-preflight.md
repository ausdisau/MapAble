# Production preflight checklist

Run this checklist before promoting MapAble to a public production deployment.

**Canonical host (Wave 0):** `https://mapable.com.au` (apex).  
`www.mapable.com.au` should redirect to apex after TLS for www is renewed (account-owner operation).

## Build readiness

- [ ] `pnpm setup:cloud-agent`
- [ ] `pnpm type-check`
- [ ] `pnpm build`
- [ ] Focused tests for touched areas pass.
- [ ] No unresolved merge conflicts.
- [ ] `pnpm ci:prod-audit` passes (or only reviewed unexpired allowlist entries remain).

## Hosting

- [ ] Vercel billing active, or fallback host selected.
- [ ] Project linked to the correct GitHub repository.
- [ ] `mapable.com.au` and `www.mapable.com.au` assigned to the production project.
- [ ] `mapable.com.au` is the canonical host; www redirects to apex after cert renewal.
- [ ] Preview deployment policy understood.

## Auth

- [ ] `NEXTAUTH_SECRET` is stable, private, and at least 16 characters.
- [ ] `NEXTAUTH_URL=https://mapable.com.au`.
- [ ] `NEXT_PUBLIC_APP_URL=https://mapable.com.au`.
- [ ] Production validation rejects localhost / HTTP for these URLs (`lib/config/canonical-url.ts`).
- [ ] `/api/auth/session` returns 200.
- [ ] `/api/auth/providers` returns 200.
- [ ] `/login` and `/register` render without client fetch errors.
- [ ] OAuth callback URLs are configured for every enabled provider.

## Database

- [ ] `DATABASE_URL` is a pooled runtime URL.
- [ ] `DIRECT_URL` is a direct migration URL.
- [ ] Production branch/backups are owned.
- [ ] `prisma migrate deploy` plan reviewed.
- [ ] No destructive migration runs without backup approval.
- [ ] Never use `prisma db push` against shared or production databases.

## Storage and documents

- [ ] Document storage mode is production-safe before document uploads are enabled.
- [ ] Sensitive documents are not stored in identity-provider metadata.
- [ ] Data access logging is enabled for sensitive reads where implemented.

## Email and messaging

- [ ] SendGrid or email provider configured if password reset/email flows are enabled.
- [ ] Twilio Verify credentials configured if `TWILIO_2FA_ENABLED=true`.
- [ ] Marketing messaging remains disabled until opt-in, sender compliance and unsubscribe flows are confirmed.

## Analytics and AI

- [ ] Product analytics env vars are configured only if analytics are approved.
- [ ] LLM analytics env vars are configured only if LLM tracing is approved.
- [ ] No API keys are hardcoded.
- [ ] User identifiers in analytics are minimal and privacy-reviewed.
- [ ] AI / NDIA / payment capability flags remain fail-closed unless explicitly enabled with `=== "true"`.

## SEO/AEO

- [ ] `/robots.txt` returns 200.
- [ ] `/sitemap.xml` returns 200.
- [ ] Canonical URL points to `https://mapable.com.au`.
- [ ] `/jobs` permanently redirects to `/employment`.
- [ ] Public claims avoid unsupported NDIS registration, WCAG conformance and data sovereignty statements.

## Uptime monitoring probes

Use these non-sensitive endpoints (no auth, `Cache-Control: no-store`):

| Probe     | Path                    | Ready when                                                                                  |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| Liveness  | `GET /api/health/live`  | `200` `{ "status": "ok" }` — process only                                                   |
| Readiness | `GET /api/health/ready` | `200` `{ "status": "ready" }` — DB reachable; `503` `{ "status": "unavailable" }` otherwise |

Do not alert on readiness alone during planned maintenance. Never expect hostnames, credentials, or stack traces in responses.

## Post-deploy smoke checks

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
# Confirm JSON-LD uses https://mapable.com.au (not localhost/www)
curl -I https://mapable.com.au/jobs
```
