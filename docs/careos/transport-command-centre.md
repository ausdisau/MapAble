# CareOS Phase 8 — Accessible Transport Command Centre

Phase 8 adds evidence-based accessibility matching, return-trip assurance, public transit adapters, continuity recovery with mandatory confirmation, and command-centre UI surfaces.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_TRANSPORT_COMMAND_ENABLED` | `false` | Master switch for command centre APIs and UI |
| `MAPABLE_TRANSPORT_CONTINUITY_RECOVERY_ENABLED` | `false` | Deterministic recovery option presentation |
| `MAPABLE_TRANSPORT_PUBLIC_TRANSIT_ADAPTERS_ENABLED` | `false` | GTFS / GTFS-RT style public transit feeds |
| `MAPABLE_TRANSPORT_AUTO_SUBSTITUTION_ENABLED` | **hardcoded `false`** | Silent vehicle/provider substitution is never permitted |

## Safety model

1. **Evidence-based accessibility** — Vehicle suitability is assessed from `VehicleAccessibilityEvidence`, `MobilityDeviceCompatibility`, `RestraintCapability`, and `VehicleInspection` records. Generic "wheelchair accessible" labels alone are insufficient when ramp/lift evidence is required.
2. **No silent substitution** — Recovery options are presented; operational changes require participant (or authorised delegate) confirmation via `confirmRecoveryOption`.
3. **Non-live alternatives** — Public transit adapters expose `source`, `fetchedAt`, and `isLive`. When live feeds are stale, static GTFS snapshots and advisory route plans remain available.
4. **Return-trip assurance** — Outbound and return legs link via `outboundTripId` / `returnTripId` with an assurance workflow tracked in `TransportReturnTripAssurance`.

## Schema (migration `20260714090000_transport_command_centre`)

Net-new models:

- `VehicleAccessibilityEvidence`
- `MobilityDeviceCompatibility`
- `RestraintCapability`
- `VehicleInspection`
- `TransportReturnTripAssurance`
- `TransportContinuityRecoveryRequest` / `TransportContinuityRecoveryOption`
- `TransportDisruptionEvent`

`TransportTrip` extensions: `tripDirection`, `outboundTripId`, `returnTripId`, `returnAssuranceStatus`.

## Module layout

```
lib/transport/accessibility/   — evidence-based compatibility
lib/transport/fleet/           — vehicle inspections
lib/transport/continuity/        — return trips + recovery
lib/transport/public-transit/  — provider-neutral GTFS adapters
lib/config/transport-command.ts
app/participant/transport/       — participant command view
app/transport-operator/          — operator disruption queue
app/support-coordinator/transport/ — thin coordinator overview
components/transport/            — assurance, disruption, recovery panels
```

## Key APIs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/transport/accessibility/[vehicleId]` | Evidence + compatibility assessment |
| GET/POST | `/api/transport/return-trips/[tripId]/assure` | Return-trip linkage and assurance |
| POST | `/api/transport/continuity/[tripId]/options` | Present recovery options (operator) |
| POST | `/api/transport/continuity/[tripId]/confirm` | Participant confirms an option |
| GET | `/api/transport/public-transit/disruptions` | Transit disruptions + lift outages |
| GET/PATCH | `/api/transport/command/disruptions` | Internal disruption queue |

## Continuity recovery triggers

Supported triggers: `driver_cancel`, `vehicle_failure`, `late_pickup`, `route_disruption`, `lift_outage`, `appointment_change`, `missing_return_trip`.

When no evidence-compliant option exists, the request is escalated — no automatic reassignment occurs.

## Public transit adapters

Provider-neutral interfaces in `lib/transport/public-transit/types.ts`:

- `PublicTransitAdapter.getRouteAccessibility`
- `PublicTransitAdapter.getRealtimeUpdates`
- `PublicTransitAdapter.getDisruptions`
- `PublicTransitAdapter.getAccessibleRouteDetails`

The default `MockGtfsAdapter` supplies static and mock live data for development.

## Validation

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/mapable
export DIRECT_URL=postgresql://user:password@localhost:5432/mapable
pnpm prisma validate && pnpm prisma generate
pnpm vitest run tests/transport
```
