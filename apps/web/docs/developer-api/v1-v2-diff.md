# MapAble public API — v1 vs v2

## v1 (default)

- `GET /api/v1/places` — stable places list
- `POST /api/v1/plan-manager/exports` — plan manager export (requires Y2 flag)

## v2 (draft / partner flag)

Requires `PUBLIC_API_V2_PARTNER_ENABLED=true`.

- `GET /api/v2/places` — expanded metadata wrapper
- `GET /api/v2/care/shifts` — tenant-scoped shift list with `X-Organisation-Id` header
- `POST /api/v2/plan-manager/exports` — export with `apiVersion: "v2"` and line-item schema version

## Version headers

Responses include `X-MapAble-Api-Version`. v1 responses may include `Deprecation` and `Link` successor-version when v2 partner mode is enabled.

## Promotion workflow

1. Enable `PUBLIC_API_V2_PARTNER_ENABLED` in staging
2. Mark v2 stable in `/admin/api-versioning` (database `PublicApiVersion.status`)
3. Notify partners before changing default version
