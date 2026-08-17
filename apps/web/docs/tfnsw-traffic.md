# TfNSW Open Data — Live Traffic NSW & Trip Planner

MapAble proxies [Transport for NSW Open Data](https://opendata.transport.nsw.gov.au/) on the server so API keys never reach the browser. Two product families share one gateway:

| Product | Base path | Use in MapAble |
|---------|-----------|----------------|
| **Live Traffic NSW** | `/v1/live/` | Road hazards, cameras, service status (GeoJSON) |
| **Trip Planner** | `/v1/tp/` | Stop search, departures, service alerts, stops near a point |

## Setup

1. Register at the [TfNSW Open Data Hub](https://opendata.transport.nsw.gov.au/) and create an application API key.
2. Add to server environment (Vercel / `.env.local`):

```bash
TFNSW_API_KEY=your_production_key
TFNSW_LIVE_TRAFFIC_ENABLED=true
TFNSW_TRIP_PLANNER_ENABLED=true
# Optional: attach open incidents to route estimates
TFNSW_ENRICH_ROUTE_ESTIMATES=true
TFNSW_CACHE_TTL_SECONDS=120
```

Legacy alias: `TRANSPORT_NSW_API_KEY` is accepted if `TFNSW_API_KEY` is unset.

Auth header sent upstream: `Authorization: apikey {YOUR_KEY}`.

## API routes (MapAble)

All routes require `transport:read:org` (same as routing estimates).

### Live Traffic

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transport/traffic/status` | Live Traffic NSW overall status |
| GET | `/api/transport/traffic/cameras` | Traffic cameras GeoJSON |
| GET | `/api/transport/traffic/hazards?category=incident&state=open` | Hazard feed (`category`, `state` query params) |
| POST | `/api/transport/traffic/nearby` | Hazards near a route corridor (JSON body: `origin`, `destination`, optional `waypoints`) |

### Trip Planner

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transport/tp/departures?stopId=10101331` | Departure board for a stop ID |
| GET | `/api/transport/tp/stops/search?query=Sydney` | Stop / address autocomplete |
| GET | `/api/transport/tp/alerts` | Public transport service alerts |
| GET | `/api/transport/tp/coord?lat=-33.87&lng=151.21` | Stops near coordinates |

Trip Planner responses are passed through as JSON from TfNSW (`rapidJSON` where applicable). Stop IDs come from stop finder or [transportnsw.info](https://transportnsw.info).

## Route estimate enrichment

When `TFNSW_ENRICH_ROUTE_ESTIMATES=true`, `POST /api/transport/routing/estimate` may include a `trafficAdvisory` object with nearby **open incidents** along the corridor. This is advisory only and does not change ETAs from OSRM/GraphHopper/etc.

## Governance

- Traffic and trip data are **indicative**; drivers and planners must follow official signage and participant care plans.
- No autonomous dispatch: traffic feeds do not auto-cancel or reroute trips without human review (see transport scheduling docs).
- Respect TfNSW [terms of use](https://opendata.transport.nsw.gov.au/) and attribution in `rights` / `licence` fields on GeoJSON responses when displaying hazards publicly.

## References

- [API basics](https://developer.transport.nsw.gov.au/developers/api-basics)
- [Live Traffic NSW developer guide](https://opendata.transport.nsw.gov.au/data/dataset/live-traffic-api)
- [Trip Planner APIs](https://developer.transport.nsw.gov.au/data/dataset/trip-planner-apis)
