# Environment Variable Mapping: REPL → mapableau-new

Add all of these to your **Vercel project settings → Environment Variables**.
Never commit secrets to git. Mark all secrets as "Sensitive" in Vercel.

---

## Database

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `NEON_DATABASE_URL` | `DATABASE_URL` | Same Neon Postgres instance; mapableau-new uses Prisma's `DATABASE_URL` (pooled) + `DIRECT_URL` (non-pooled for migrations) |
| `DATABASE_URL` | `DIRECT_URL` | Non-pooled connection for `prisma migrate deploy` |

---

## Auth

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `SESSION_SECRET` | _(replaced by next-auth `AUTH_SECRET`)_ | Generate a new secret; not the same mechanism |
| `AUTH0_DOMAIN` | _(not applicable — Keycloak/next-auth)_ | Auth0 users must re-authenticate via next-auth |
| `AUTH0_CLIENT_ID` | _(not applicable)_ | |
| `AUTH0_CLIENT_SECRET` | _(not applicable)_ | |

---

## Stripe

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Same |
| `STRIPE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Next.js requires `NEXT_PUBLIC_` prefix for client exposure |
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Same |
| `STRIPE_BECS_DISABLED` | `STRIPE_BECS_DISABLED` | Set to `1` to disable AU BECS |
| `STRIPE_CONNECT_ENABLED` | `STRIPE_CONNECT_ENABLED` | Set to `1` to enable Connect/payouts |
| `STRIPE_PLATFORM_FEE_BPS` | `STRIPE_PLATFORM_FEE_BPS` | Default 500 (5%) |

---

## Orb (usage metering) — NEW in mapableau-new

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `ORB_API_KEY` | `ORB_API_KEY` | Same — mark as secret |
| `ORB_WEBHOOK_SECRET` | `ORB_WEBHOOK_SECRET` | Same |

---

## NDIS PRODA

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `NDIS_PRODA_BASE_URL` | `NDIS_PRODA_BASE_URL` | Same |
| `NDIS_PRODA_CLIENT_ID` | `NDIS_PRODA_CLIENT_ID` | Mark as secret |
| `NDIS_PRODA_CLIENT_SECRET` | `NDIS_PRODA_CLIENT_SECRET` | Mark as secret |
| `NDIS_PRODA_DEVICE_NAME` | `NDIS_PRODA_DEVICE_NAME` | Same |
| `NDIS_PRODA_ORG_ID` | `NDIS_PRODA_ORG_ID` | Same |
| `NDIS_PRODA_TOKEN_URL` | `NDIS_PRODA_TOKEN_URL` | Optional override |
| `NDIS_PRODA_SCOPE` | `NDIS_PRODA_SCOPE` | Optional scope override |

---

## QuickBooks Online (optional — can co-exist with Xero)

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `QB_CLIENT_ID` | `QB_CLIENT_ID` | Mark as secret |
| `QB_CLIENT_SECRET` | `QB_CLIENT_SECRET` | Mark as secret |
| `QB_REDIRECT_URI` | `QB_REDIRECT_URI` | Update to new Vercel domain: `https://<your-domain>/api/billing/quickbooks/auth` |
| `QB_ENVIRONMENT` | `QB_ENVIRONMENT` | `"sandbox"` or `"production"` |
| `QB_WEBHOOK_VERIFIER_TOKEN` | `QB_WEBHOOK_VERIFIER_TOKEN` | Optional HMAC verification |

---

## AgentMail — NEW in mapableau-new

| REPL variable | mapableau-new equivalent | Notes |
|---|---|---|
| _(Replit connector — no env var)_ | `AGENTMAIL_API_KEY` | Get from agentmail.to dashboard; mark as secret |
| _(Replit connector — no env var)_ | `AGENTMAIL_BASE_URL` | Optional: override default `https://api.agentmail.to/v0` |

---

## ABR (ABN lookup)

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `ABR_GUID` | `ABR_GUID` | Optional; format-only validation works without it |

---

## Grocery supplier

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `GROCERY_SUPPLIER_PROVIDER` | `GROCERY_SUPPLIER_PROVIDER` | `openfoodfacts` / `woolworths` / `coles` / `iga` / `csv` / `composite` |
| `GROCERY_SUPPLIER_CHAIN` | `GROCERY_SUPPLIER_CHAIN` | Composite fallback order |
| `GROCERY_SUPPLIER_SEARCH_TERMS` | `GROCERY_SUPPLIER_SEARCH_TERMS` | Comma-separated |
| `GROCERY_SUPPLIER_TIMEOUT_MS` | `GROCERY_SUPPLIER_TIMEOUT_MS` | Default 12000 |
| `GROCERY_SUPPLIER_STORE_ID` | `GROCERY_SUPPLIER_STORE_ID` | Generic store fallback |
| `GROCERY_SUPPLIER_POSTCODE` | `GROCERY_SUPPLIER_POSTCODE` | |
| `GROCERY_SUPPLIER_SUBURB` | `GROCERY_SUPPLIER_SUBURB` | |
| `WOOLWORTHS_API_KEY` | `WOOLWORTHS_API_KEY` | Official API portal key |
| `WOOLWORTHS_STORE_ID` | `WOOLWORTHS_STORE_ID` | |
| `WOOLWORTHS_POSTCODE` | `WOOLWORTHS_POSTCODE` | |
| `WOOLWORTHS_SUBURB` | `WOOLWORTHS_SUBURB` | |
| `WOOLWORTHS_API_STORE_PARAM` | `WOOLWORTHS_API_STORE_PARAM` | Default `storeId` |
| `COLES_API_KEY` | `COLES_API_KEY` | |
| `COLES_STORE_ID` | `COLES_STORE_ID` | Default `0584` |
| `COLES_POSTCODE` | `COLES_POSTCODE` | |
| `COLES_SUBURB` | `COLES_SUBURB` | |
| `IGA_STORE_ID` | `IGA_STORE_ID` | |
| `IGA_POSTCODE` | `IGA_POSTCODE` | |
| `IGA_SUBURB` | `IGA_SUBURB` | |
| `GROCERY_SUPPLIER_CSV_PATH` | `GROCERY_SUPPLIER_CSV_PATH` | Local path or URL |
| `GROCERY_SUPPLIER_DISABLED` | `GROCERY_SUPPLIER_DISABLED` | Set to `1` to disable |

---

## Chat / AI

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | _(replaced by Vercel AI SDK config)_ | mapableau-new uses `@ai-sdk/openai-compatible`; configure via `OPENAI_API_KEY` or `GOOGLE_API_KEY` per mapableau-new's existing AI config |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | _(replaced by Vercel AI SDK config)_ | |

---

## Safeguarding / notifications — NEW in mapableau-new

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| _(SMS sent via Twilio, no dedicated env var)_ | `SAFEGUARDING_ALERT_PHONE` | On-call phone for critical safeguarding SMS alerts |
| _(Twilio already in mapableau-new)_ | _(use existing Twilio config)_ | |

---

## Vercel Cron (auto-debit) — NEW in mapableau-new

| Variable | Value | Notes |
|---|---|---|
| `CRON_SECRET` | _(generate with `openssl rand -base64 32`)_ | Protects the `/api/billing/auto-debit/tick` endpoint; Vercel Cron sends this automatically |

---

## accessiBe widget

| REPL variable | mapableau-new variable | Notes |
|---|---|---|
| `VITE_ACCESSIBE_SITE_KEY` | `NEXT_PUBLIC_ACCESSIBE_SITE_KEY` | Add `NEXT_PUBLIC_` prefix for client exposure in Next.js |

---

## Object storage (not ported — replaced by Supabase Storage)

| REPL variable | mapableau-new equivalent | Notes |
|---|---|---|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Supabase Storage bucket | Use mapableau-new's existing Supabase Storage |
| `PRIVATE_OBJECT_DIR` | Supabase Storage RLS policies | Replaced by Supabase's row-level security |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Supabase Storage public bucket config | |
| `ASSETS_BUCKET_ID` | Supabase Storage bucket | |
| `ASSET_BUCKETS` | Supabase Storage bucket config | |

---

## Variables with no mapableau-new equivalent (not needed after port)

| REPL variable | Reason not ported |
|---|---|
| `VITE_*` prefix vars | Vite-specific; Next.js uses `NEXT_PUBLIC_` |
| `NODE_ENV` | Auto-set by Vercel |
| `PORT` | Not applicable on Vercel serverless |
