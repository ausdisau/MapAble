# Transport module

**Maturity:** trip ops = merged_but_flagged / controlled_pilot; quotes = **merged_but_flagged** (Prisma durable, not production_supported).  
**Lane:** MapAble Network / Infrastructure facilitation — not a guarantee of accessible arrival.  
**Canonical SoT for new work:** `TransportTrip` / `TransportTripRequest` / `TransportTripEvent`  
(legacy `TransportBooking` preserved via booking bridge).

## Built

- Detailed transport bookings and `TransportTrip` operations
- Operator assignment, driver/vehicle assignment paths, suitability warnings
- Feature-status honesty matrix (`lib/transport/feature-status.ts`): Available now |
  Pilot / sandbox | Coming next | Requires partner
- **Persistent first-class quotes** — Prisma `TransportQuote` + `TransportQuoteVersion`
  (`POST /api/transport/quotes`, `GET /api/transport/quotes/[id]`,
  `POST /api/transport/quotes/[id]/accept`)
- **Staged location disclosure** — `lib/transport/privacy/location-disclosure.ts`
  (provider exact address still withheld at `accepted` until assignment window)
- Completed trip → `BillingServiceRecord` via `POST /api/transport/trips/[tripId]/billing-handoff`
- Funding disclaimer stored per quote version — quote ≠ NDIS funding approval
- Pricing components may be zero until versioned pricing policy applied

## Routes

- Participant / ops: `/transport`, dashboard transport surfaces
- APIs: `/api/transport/bookings`, `/api/transport/trips`, `/api/transport/quotes`,
  routing and partner adapters as flagged
- Provider / admin: `/provider/transport`, `/admin/transport`

## Privacy

- Mobility aids shared only with consent (`transport.accessibility_share`)
- Exact pickup/drop-off restricted: participant, authorised operator staff after acceptance,
  assigned driver within permitted window, audited administrators
- Before acceptance: masked label / suburb — not exact address
- Do not put sensitive participant data in OpenStreetMap layers

## Limitations / honesty

- No live GPS requirement as universal prerequisite (`TRANSPORT_LIVE_TRACKING_ENABLED` default false)
- Default routing provider is **mock** — sandbox/pilot labels required; never silent mock as live in production
- Quotes are durable in Prisma but **not production_supported** until pilot exit criteria
- Quote acceptance ≠ exact address for providers; assignment window still required
- Route-found ≠ completed trip ≠ participant outcome
- No autonomous dispatch; no guaranteed accessible ETA

## Programme next steps

1. Driver/vehicle eligibility confirmation completeness
2. Recurring Care + journey integration (programme PR 3–4)
3. Return-journey recovery with Continuity (PR 5)

## Care + Transport map (flagged)

Pilot GPT/OSM map at `/care-transport/map` (flag `CARE_TRANSPORT_MAP_ENABLED`, default false).
Public discovery pins only; trip points require sign-in and use staged location disclosure.
Infrastructure suggest: `/add-infrastructure` (`ADD_INFRASTRUCTURE_ENABLED`).
See `docs/modules/care-transport-map.md`.

## Related

- `docs/modules/care-transport-map.md`
- `docs/transport/*` (product requirements, ADRs, implementation checklist)
- `docs/productisation/CARE_TRANSPORT_BILLING_SLICE.md`
- `docs/productisation/CAPABILITY_REGISTRY.md`
- `docs/strategy/STRATEGIC_OPPORTUNITIES.md`
- Root `STRATEGY.md` (accessible ride-share principles)
