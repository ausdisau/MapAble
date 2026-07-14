# CareOS Phase 12 — Open API and Partner Ecosystem

Phase 12 adds a versioned Open API, developer portal, OAuth client registration, webhook subscriptions with signed delivery, and audit logging. It extends existing `docs/developer-api`, `lib/developer-api`, `lib/partner-api-program`, `lib/api-versioning`, and `PartnerSandboxApp` — not a fork.

## Safety boundaries (hard)

CareOS **must NOT**:

- Show API keys or webhook secrets after initial creation (hashed at rest)
- Grant partner access without participant authority (`x-participant-id` + grant)
- Allow service accounts to inherit participant session authority
- Return production participant data in sandbox environment

Enforced in `lib/platform/developer-auth/participant-gate.ts` and `lib/config/developer-platform.ts`.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_DEVELOPER_PLATFORM_ENABLED` | `false` | Master switch for developer platform |
| `MAPABLE_PARTNER_WEBHOOKS_ENABLED` | `false` | Webhook subscriptions and delivery |
| `serviceAccountParticipantAuthorityEnabled` | **hardcoded `false`** | Service accounts never inherit participant authority |

## Schema (migration `20260714130000_developer_platform`)

| Model | Purpose |
| ----- | ------- |
| `ApiClient` | Registered API client (sandbox or production) |
| `ApiKey` | Hashed secret, prefix only after creation |
| `OAuthClient` | OAuth2 client credentials |
| `OAuthGrant` | Participant-scoped OAuth grants |
| `ApiAccessScope` | Existing scope catalog (enum `ApiScope`) |
| `ServiceAccount` | Machine identity (no participant authority) |
| `ApiAccessLog` | Request audit trail |
| `WebhookSubscription` | Endpoint + signing secret (rotation supported) |
| `WebhookDeliveryLog` | Delivery attempts, retries, dead-letter |

Legacy models (`DeveloperApp`, `DeveloperApiKey`, `PartnerSandboxApp`) remain; `provisionPlatformClientFromDeveloperApp` bridges them.

## Module layout

```
lib/platform/
  api/              — cursor pagination, structured errors, v1 handler
  developer-auth/   — API key auth, OAuth, service accounts, access logs
  webhooks/         — signing, delivery queue, secret rotation
lib/config/developer-platform.ts
lib/developer-api/  — extended bridge to platform clients
app/api/v1/         — versioned REST routes
app/developers/     — developer portal UI
docs/api/openapi-careos-v1.yaml
docs/developer-api/sdk-workflows.md
```

## v1 API routes

| Method | Path | Scope | Participant authority |
| ------ | ---- | ----- | --------------------- |
| GET | `/api/v1/participants` | `providers_read` | required |
| GET | `/api/v1/organisations` | `providers_read` | — |
| GET | `/api/v1/missions` | `bookings_read` | required |
| GET | `/api/v1/care` | `bookings_read` | required |
| GET | `/api/v1/transport` | `bookings_read` | required |
| GET | `/api/v1/access` | `places_read` | — |
| GET | `/api/v1/jobs` | `bookings_read` | required |
| GET | `/api/v1/documents` | `invoices_read` | required |
| GET | `/api/v1/events` | `bookings_read` | required |
| GET/POST/PATCH | `/api/v1/webhooks` | `webhooks_receive` | portal actions via session |

Headers:

- `X-Api-Key` — platform API key (`cos_…`)
- `X-Participant-Id` — participant context (required for participant-scoped routes)
- `X-Delegate-User-Id` — optional delegate acting on behalf of participant

## Webhooks

- HMAC-SHA256 signing with timestamp (`X-CareOS-Signature`, `X-CareOS-Timestamp`)
- Replay protection via unique `eventId` and timestamp window (5 minutes)
- Exponential backoff retries; dead-letter after `MAPABLE_WEBHOOK_MAX_ATTEMPTS` (default 5)
- Secret rotation with 24h grace period for previous secret

## Developer portal

- `/developers` — client list, scope catalog, safety notice
- `/developers/clients/[clientId]` — keys, OAuth, webhooks, access log
- `/developers/docs` — quick reference

## SDK workflows

See `docs/developer-api/sdk-workflows.md`. Generated SDKs are **not** committed — use OpenAPI Generator locally.

## Tests

```
tests/api/contracts/   — pagination, error shape
tests/api/auth/        — scope enforcement, platform flags
tests/webhooks/        — signing, replay protection, retries
```

## Deploy

```bash
npx prisma migrate deploy && npx prisma generate && pnpm test
```

Set `MAPABLE_DEVELOPER_PLATFORM_ENABLED=true` to enable. Webhooks additionally require `MAPABLE_PARTNER_WEBHOOKS_ENABLED=true`.
