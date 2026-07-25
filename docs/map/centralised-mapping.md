# Centralised mapping

MapAble maps share types, GeoJSON builders, entity mappers, and MapLibre configuration under `lib/map/`.

## Data sources

| Source | Used by | Coordinates |
|--------|---------|-------------|
| `public/data/provider-outlets.json` | Provider Finder list/grid (default) | Outlet `Latitude` / `Longitude` |
| `ndis_providers` (Postgres) | Ask, agent tools, optional map pins | `latitude` / `longitude` when ingested |
| `access_places` + `access_place_locations` | Access map UI | Per-place location row |
| `searchable_locations` | Autocomplete (no coords) | Geocoding hint only |

## Environment flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_MAP_STYLE_URL` | MapLibre demo tiles | Shared map style |
| `NEXT_PUBLIC_MAP_DEFAULT_LAT` / `LNG` / `ZOOM` | Sydney area | Default viewport |
| `MAP_INTEGRATION_ENABLED` | enabled | MapLibre integration health |
| `OPENSTREETMAP_ENABLED` | enabled | OpenStreetMap tiles + Nominatim integration |
| `OSM_NOMINATIM_BASE_URL` | public Nominatim | Geocode API base (respect usage policy) |
| `PROVIDER_FINDER_MAP_SOURCE` | `outlets` | `outlets` \| `ndis` \| `hybrid` map pins |
| `PROVIDER_FINDER_MAP_PIN_LIMIT` | `500` | Max pins per map response |
| `MAP_GEOCODING_NOMINATIM_ENABLED` | `false` | Server forward geocode fallback |
| `ACCESS_MAP_OVERLAY_ENABLED` | `false` | Future: access places on Finder map |
| `CARE_TRANSPORT_MAP_ENABLED` | `false` | Care + Transport GPT/OSM map |
| `ADD_INFRASTRUCTURE_ENABLED` | `false` | GPT-assisted infrastructure suggest |

## API

- `GET /api/providers/ndis/search` — NDIS directory search (includes lat/lng when present).
- `GET /api/providers/map` — GeoJSON pins for Provider Finder when `PROVIDER_FINDER_MAP_SOURCE` is `ndis` or `hybrid`.
- `GET /api/care-transport/map` — Care providers + infrastructure (+ masked trips when signed in). See `docs/modules/care-transport-map.md`.
- `POST /api/infrastructure/draft` — draft moderated Care/Transport place fields.

## Code layout

- `lib/map/types.ts` — `MapPointEntity`, feature property types
- `lib/map/geojson.ts` — `entitiesToGeoJSON`
- `lib/map/mappers/` — outlet, NDIS, access place → entities / Provider DTOs
- `lib/map/geocoding-service.ts` — suburb/postcode → coordinates
- `components/map/MapLibreMap.tsx` — Provider Finder map
- `components/access/AccessMapLayer.tsx` — Access map (shared style via `MapProvider`)
- `components/care-transport/*` — Care + Transport map + add-infrastructure UI

## Extension: access overlay on Finder

When `ACCESS_MAP_OVERLAY_ENABLED=true`, add a second GeoJSON source (`MAP_SOURCE_IDS.accessPlaces`) to `MapLibreMap` — not enabled in v1.

## Care + Transport map

See `docs/modules/care-transport-map.md` for layers, Ask context `care_transport_map`, and privacy rules.
