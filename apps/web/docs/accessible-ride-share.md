# Accessible ride-sharing (MapAble)

Human-dispatched, disability-aware transport built on `TransportTrip`, with optional pooling via `RideRun`.

## Mobility vocabulary

All trips use the canonical schema in [`lib/transport/mobility-schema.ts`](../lib/transport/mobility-schema.ts). Participant [`AccessibilityProfile`](../lib/validation/accessibility.ts) maps into trip snapshots via `prefillFromProfile` on create.

Key fields:

| Field | Meaning |
|-------|---------|
| `requiresWheelchairAccessible` | Wheelchair-accessible vehicle |
| `requiresRamp` / `requiresLift` / `requiresHoist` | Boarding equipment |
| `assistanceAnimalPresent` | Assistance-animal-friendly vehicle |
| `driverAssistanceRequired` | Driver training / door assistance |
| `needsExtraBoardingTime` | Schedule buffer (operational) |

Eligibility is enforced at assignment in [`transport-eligibility-service.ts`](../lib/transport/transport-eligibility-service.ts).

## Consent

| Scope | Purpose |
|-------|---------|
| `transport.accessibility_share` | Share mobility profile with provider for matching |
| `transport.trip_access` | Family/nominee summary view of trips |

Grant via `/dashboard/consent` (includes `transport.trip_access`).

## Participant UI

| Route | Purpose |
|-------|---------|
| `/dashboard/transport/new` | Mobility wizard + profile prefill |
| `/dashboard/transport/[tripId]` | Suitability warnings, handover progress, safety link |

## Provider UI

| Route | Purpose |
|-------|---------|
| `/provider/transport/dispatch` | Dispatch board, suggestions, assign |
| `/provider/transport/runs` | Create/lock ride runs, attach trips |

## APIs (Phase 1)

| Method | Path |
|--------|------|
| GET | `/api/transport/mobility-prefill` |
| GET | `/api/provider/transport/trips/[tripId]/suggestions` |
| GET/POST | `/api/transport/trips/[tripId]/handover` |
| POST | `/api/transport/trips/[tripId]/safety-check` |

## Ride pooling (Phase 2)

Enable `TRANSPORT_RIDE_POOLING_ENABLED=true`.

1. Create `RideRun` with vehicle and window.
2. Attach `TransportTrip` records (strictest mobility intersection).
3. **Lock** run after human review (`requiresHumanReview` cleared).

Rules:

- Each participant keeps their own trip (consent, disputes, incidents).
- No auto-merge without dispatcher lock.

| Method | Path |
|--------|------|
| GET/POST | `/api/transport/runs` |
| POST | `/api/transport/runs/[runId]/trips` |
| POST | `/api/transport/runs/[runId]/lock` |

## NDIS / billing bridge

When `TRANSPORT_BOOKING_BRIDGE_ENABLED=true`, completing a trip (`trip_completed` or `closed`) creates a linked `Booking` with `transportTripId` for human claim review—not automatic NDIA submission.

## Environment

```env
TRANSPORT_BOOKING_BRIDGE_ENABLED=false
TRANSPORT_RIDE_POOLING_ENABLED=false
TFNSW_ENRICH_ROUTE_ESTIMATES=false
```

## Governance

- Match suggestions and route optimisation are **advisory** (`requiresHumanReview`).
- Safety escalation: [`docs/safety.md`](safety.md).
- TfNSW traffic: [`docs/tfnsw-traffic.md`](tfnsw-traffic.md).
