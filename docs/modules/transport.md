# Transport module

**Maturity:** trip ops = merged_but_flagged / controlled_pilot; quotes = **merged_but_process_local**.  
**Lane:** MapAble Network / Infrastructure facilitation — not a guarantee of accessible arrival.  
**Canonical SoT for new work:** `TransportTrip` / `TransportTripRequest` / `TransportTripEvent`  
(legacy `TransportBooking` preserved via booking bridge).

## Built

- Detailed transport bookings and `TransportTrip` operations
- Operator assignment, driver/vehicle assignment paths, suitability warnings
- Feature-status honesty matrix (`lib/transport/feature-status.ts`): Available now |
  Pilot / sandbox | Coming next | Requires partner
- **First-class quotes (process-local until Prisma Prompt 2 / programme PR 2)** —
  `POST /api/transport/quotes`, `POST /api/transport/quotes/[id]/accept`
  (`lib/transport/quotes/quote-service.ts` uses an in-process `Map`; clears on restart)
- **Staged location disclosure** — `lib/transport/privacy/location-disclosure.ts`
  (exact address only after acceptance / authorised window)
- Completed trip → `BillingServiceRecord` via `POST /api/transport/trips/[id]/billing-handoff`
- Funding disclaimer on quotes — quote ≠ NDIS funding approval
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
- Process-local quotes are **not durable** — do not market as production quote store
- Route-found ≠ completed trip ≠ participant outcome
- No autonomous dispatch; no guaranteed accessible ETA

## Programme next steps

1. **PR 2** — Persist `TransportQuote` / versions in Prisma; keep staged disclosure
2. Driver/vehicle eligibility confirmation completeness
3. Return-journey recovery with Continuity (PR 5)

## Related

- `docs/transport/*` (product requirements, ADRs, implementation checklist)
- `docs/productisation/CARE_TRANSPORT_BILLING_SLICE.md`
- `docs/productisation/CAPABILITY_REGISTRY.md`
- `docs/strategy/STRATEGIC_OPPORTUNITIES.md`
- Root `STRATEGY.md` (accessible ride-share principles)
