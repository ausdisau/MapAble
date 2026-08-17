# MapAble AV MCP

Model Context Protocol server for the **Autonomous Vehicle framework** in MapAble Core. Connects Cursor (and other MCP hosts) to governance rules, trip state machines, vehicle suitability checks, and advisory OSRM routing — without enabling autonomous dispatch.

## Install in Cursor

Project config is committed at `.cursor/mcp.json`. After pulling:

1. Open **Settings → Features → Model Context Protocol** and confirm `mapable-av` is enabled.
2. Ensure `.env` includes optional `OSRM_BASE_URL` and `NEXT_PUBLIC_APP_URL` (loaded via `envFile`).
3. Restart MCP or reload the window if tools do not appear.

## Run manually

```bash
npx tsx mcp/av/server.ts
```

The server uses **stdio** transport only.

## Tools

| Tool | Purpose |
|------|---------|
| `av_get_framework` | Governance, capability matrix, API/UI entry points |
| `av_get_trip_status_graph` | Provider or driver status transition map |
| `av_validate_trip_status_transition` | Whether `from` → `to` is allowed |
| `av_check_vehicle_suitability` | Accessibility requirement vs vehicle flags |
| `av_route_estimate_advisory` | OSRM distance/duration (advisory, `requiresHumanReview`) |
| `av_mapable_transport_api_reference` | Transport REST paths and base URL hint |

## Library

Shared logic lives in `lib/platform/av-framework/` (also used by `lib/transport/transport-status-service.ts`).

## Governance

- **No** autonomous dispatch or driver/vehicle assignment via MCP.
- Routing estimates are **advisory** only.
- Aligns with [transport scheduling](modules/transport-scheduling.md) and phase non-goals for autonomous dispatch.

## Environment

| Variable | Used for |
|----------|----------|
| `OSRM_BASE_URL` | `av_route_estimate_advisory` (default: public OSRM demo) |
| `MAPABLE_BASE_URL` / `NEXT_PUBLIC_APP_URL` | API reference tool base URL |
