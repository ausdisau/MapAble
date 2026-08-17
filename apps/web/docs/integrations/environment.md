# MapAble integration environment variables

Run validation locally:

```bash
pnpm check:integrations-env
```

Secrets are never printed by the check script.

## Core (required in production)

| Variable          | Purpose                                 |
| ----------------- | --------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection (Prisma)          |
| `DIRECT_URL`      | Direct connection for migrations (Neon) |
| `NEXTAUTH_SECRET` | Session signing (Production + Preview)        |
| `MAPABLE_PREVIEW_AUTH_SECRET` | Optional Preview-only signing key (Preview env group) |
| `NEXTAUTH_URL`    | App base URL for auth callbacks         |

On **Vercel production**, `NEXTAUTH_SECRET` must be a stable private value of at least
16 characters. There is **no repo fallback** on deployed production or preview builds.

For **Vercel preview** deployments, set `NEXTAUTH_SECRET` or `MAPABLE_PREVIEW_AUTH_SECRET`
in the Preview environment group. Local development may use the dev-only fallback when
unset (see `lib/auth/nextauth-env.ts`).

## Optional integrations

Enable with `*_ENABLED=true` or provider-specific flags. Only required variables for **enabled** integrations are validated.

### PostgreSQL (`postgres`)

Always required when the app runs against a database.

### Stripe (`STRIPE_ENABLED=true`)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (webhooks)

### Xero (`XERO_ENABLED=true`)

- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`

### Keycloak (`KEYCLOAK_ENABLED=true`)

- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ISSUER_URL`
- `KEYCLOAK_REDIRECT_URI`

### MapLibre (`MAP_INTEGRATION_ENABLED` not `false`)

- `NEXT_PUBLIC_MAP_STYLE_URL`
- `NEXT_PUBLIC_MAP_ATTRIBUTION` (recommended)
- `NEXT_PUBLIC_MAP_DEFAULT_LAT`, `NEXT_PUBLIC_MAP_DEFAULT_LNG`, `NEXT_PUBLIC_MAP_DEFAULT_ZOOM`

### Temporal (`TEMPORAL_ENABLED=true`)

- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `TEMPORAL_TASK_QUEUE`

### n8n (`N8N_ENABLED=true`)

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET`

### Directus (`DIRECTUS_ENABLED=true`)

- `DIRECTUS_URL`
- `DIRECTUS_STATIC_TOKEN` (server-side only)

### Metabase (`METABASE_ENABLED=true`)

- `METABASE_SITE_URL`
- `METABASE_SECRET_KEY` (embed signing, server-side only)

### FHIR (`FHIR_PROVIDER=medplum` or `hapi`)

Medplum: `MEDPLUM_BASE_URL`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`  
HAPI: `HAPI_FHIR_BASE_URL`

### Telehealth (`TELEHEALTH_VIDEO_PROVIDER=jitsi` or `livekit`)

Jitsi: `JITSI_BASE_URL`  
LiveKit: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### Scheduling (`SCHEDULING_PROVIDER=calcom`)

- `CALCOM_API_KEY`
- `CALCOM_BASE_URL`

### ERPNext (`ERPNEXT_ENABLED=true`)

- `ERPNEXT_BASE_URL`
- `ERPNEXT_API_KEY`
- `ERPNEXT_API_SECRET`

### Realtime

- Supabase Realtime: `SUPABASE_REALTIME_ENABLED=true` + Supabase URL/keys
- Socket.IO: `SOCKETIO_ENABLED=true`, `SOCKETIO_SERVER_URL`
- Feature flag: `REALTIME_PROVIDER=supabase|socketio|polling`

### Product and LLM analytics

- `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=false` by default.
- `POSTHOG_API_KEY` enables server-side LLM generation capture.
- `POSTHOG_HOST` defaults to `https://us.i.posthog.com`; use the EU host only
  for an EU PostHog project.

LLM analytics capture model, provider, latency, token counts where available and
non-sensitive length/outcome metadata. Do not capture raw prompts or participant
support details unless a privacy review explicitly approves it.

## Local development example

```env
DATABASE_URL=postgresql://localhost:5432/mapable
NEXTAUTH_SECRET=dev-secret-change-me
NEXTAUTH_URL=http://localhost:3000
MAP_INTEGRATION_ENABLED=true
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
TEMPORAL_ENABLED=false
N8N_ENABLED=false
METABASE_ENABLED=false
```
