# Care + Transport GPT/OSM map

**Maturity:** controlled_pilot / merged_but_flagged — flags default **false**.  
**Lane:** MapAble Network discovery + moderated infrastructure suggest — not live dispatch.

## Surfaces

| Route | Purpose |
|-------|---------|
| `/care-transport/map` | MapLibre + OSM map with Care providers, infrastructure, optional masked trips, Ask panel |
| `/add-infrastructure` | GPT/heuristic draft → moderated `AccessPlace` suggest |
| `/care/find` | Links into the map when enabled |
| `/transport` | Secondary CTA to the map when enabled |

## Flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `CARE_TRANSPORT_MAP_ENABLED` | `false` | Gate map page + `GET /api/care-transport/map` |
| `CARE_TRANSPORT_MAP_PIN_LIMIT` | `500` | Max pins per discovery layer (NDIS search still caps lower) |
| `ADD_INFRASTRUCTURE_ENABLED` | `false` | Gate `/add-infrastructure` + `POST /api/infrastructure/draft` |

Also depends on shared map env: `MAP_INTEGRATION_ENABLED`, `OPENSTREETMAP_ENABLED`, optional `MAP_GEOCODING_NOMINATIM_ENABLED` for draft geocoding. Ask/GPT draft uses the same interpreter / AI Gateway path as Ask MapAble when configured.

## Layers

1. **careProviders** — NDIS directory pins with coordinates (`searchNdisProviders`)
2. **infrastructure** — published `AccessPlace` rows in care/transport categories (`care_support_hub`, `accessible_pickup_point`, `transport_depot`, `transport_station`, `health_service`, `community_centre`)
3. **trips** — signed-in participant only; pickup/drop-off via `projectLocationForStage` (never dump exact addresses into public guest responses)

## GPT

- Ask context: `care_transport_map` on `POST /api/mapable/ask`
- Returns `mapActions`: `flyTo`, `setLayers`, `highlightIds`, `suggestInfrastructure`
- Guest-safe for discovery; does not expose trip PII
- Draft endpoint may call `generateObject` when the search interpreter is configured; otherwise heuristic fill + optional Nominatim

## APIs

- `GET /api/care-transport/map?layers=careProviders,infrastructure&includeTrips=true`
- `POST /api/infrastructure/draft` — `{ description }` → draft fields + optional coords
- Submit via existing `POST /api/access/places` (pending_moderation for non-editors)

## Privacy and honesty

- Do **not** write features to OpenStreetMap.org
- Do **not** put sensitive participant data on public OSM layers
- Route estimates remain advisory; mock routing honesty unchanged
- Pilot banner on the map UI; no live ETA or autonomous dispatch claims

## Code

- Config: `lib/config/care-transport-map.ts`
- Payload: `lib/transport/care-map/map-payload.ts`
- Map actions: `lib/transport/care-map/map-actions.ts`
- Draft: `lib/transport/care-map/infrastructure-draft.ts`
- UI: `components/care-transport/*`

## Related

- `docs/map/centralised-mapping.md`
- `docs/modules/care.md`
- `docs/modules/transport.md`
- `docs/search/nl-interpreter.md`
