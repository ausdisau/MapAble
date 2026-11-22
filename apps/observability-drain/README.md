# MapAble Observability Drain

A small, isolated Vercel project for receiving **Vercel Speed Insights** Drain events without putting drain ingestion on the MapAble user-facing request path.

## Endpoints

- `GET /health` — readiness check; does not expose secrets.
- `POST /v1/vercel/speed-insights` — accepts Vercel Speed Insights Drain JSON or NDJSON batches.

## Security and privacy defaults

- Verifies `x-vercel-signature` against `VERCEL_DRAIN_SECRET` using HMAC-SHA1 over the raw request body.
- Accepts only `vercel.speed_insights.v1` events and known Core Web Vital metric types.
- Never logs the incoming payload.
- Always removes `deviceId`, `city`, and `attribution`.
- Removes raw `path` by default. Route patterns such as `/participant/[id]` are retained.
- Strips path/query data from `origin`, retaining only the origin.
- Rejects oversized bodies and excessive event counts.
- Provides no CORS headers; this endpoint is intended for server-to-server Vercel delivery only.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VERCEL_DRAIN_SECRET` | Yes | Vercel Drain signing secret. Store as a Vercel secret; never commit it. |
| `DRAIN_FORWARD_URL` | No | Independent HTTPS destination for sanitized batches. Without it, batches are validated and summarized to structured runtime logs only. |
| `DRAIN_FORWARD_AUTHORIZATION` | No | Full `Authorization` header value for the independent sink. Store as a Vercel secret. |
| `MAPABLE_DRAIN_INCLUDE_PATH` | No | Set exactly to `true` to retain query-free raw paths. Default is false. |
| `DRAIN_MAX_BODY_BYTES` | No | Maximum request size. Default 2,000,000 bytes. |
| `DRAIN_FORWARD_TIMEOUT_MS` | No | Forwarding timeout. Default 5,000 ms. |

## Local verification

```bash
npm test
npm start
curl http://localhost:3000/health
```

## Vercel project setup

Create a separate Vercel project from the canonical repository with:

- Repository: `ausdisau/MapAble`
- Root Directory: `apps/observability-drain`
- Framework preset: Other / Node.js
- Production environment: configure `VERCEL_DRAIN_SECRET`

Then create a Vercel Drain using the deployed endpoint:

```text
https://<observability-project>.vercel.app/v1/vercel/speed-insights
```

Recommended initial Drain configuration:

- Schema/data type: Speed Insights only
- Environment: production
- Encoding: NDJSON or JSON
- Sampling: 100% initially if traffic/cost permits

Do not add Logs, Web Analytics, AI Gateway, or Trace schemas to this receiver until explicit schema handlers and privacy review are added.

## Forwarding model

For durable storage and alerting, set `DRAIN_FORWARD_URL` to an **independent** observability endpoint. The receiver forwards only the sanitized batch. Keeping the durable sink independent prevents the MapAble application and its observability history from failing together.
