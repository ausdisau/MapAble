# MapAble Transport — Product Requirements

Repository: `ausdisau/mapableau-new` (Next.js + Prisma).  
Governing rule: [`.cursor/rules/mapable-transport.mdc`](../../.cursor/rules/mapable-transport.mdc).  
Related legacy notes: [`docs/modules/transport.md`](../modules/transport.md), [`docs/modules/transport-scheduling.md`](../modules/transport-scheduling.md).

## North star

MapAble Transport is an accessibility-first, privacy-preserving transport request, dispatch, trip, evidence, and billing module for Australia. Participants and authorised supporters request fit-checked trips; operators quote and assign eligible drivers and vehicles; drivers deliver from a mobile-first field view; everyone sees truthful status and funding language.

MapAble is **not** an emergency service. Immediate danger → **000**.

## Actors and journeys

### Participant

1. Maintain a Transport Access Profile (mobility, boarding, assistance, communication, sensory, companions, service animal) **without** disclosing a diagnosis.
2. Request a one-way or return trip with trip-specific overrides of profile defaults.
3. Receive only options that can satisfy declared access requirements (or a clear manual-review path).
4. Understand whether a price is an estimate, provider quote, participant-paid amount, or potentially claimable amount.
5. Explicitly confirm a quote before a booking/trip is created from that quote.
6. See a privacy-safe timeline and real (or honestly labelled advisory) status updates.
7. Communicate with the assigned operator/driver without exposing unnecessary personal information.
8. Confirm completion, dispute a record, report an incident, or complain.
9. Obtain a service record and invoice tied to the pricing rule version that applied.

### Authorised delegate / coordinator

1. Act only within current consent scopes (`transport.trip_access` and future transport-specific consents).
2. Be visibly identified on every write (“acting for”).
3. See action queues (quote expiry, conflicts, completion pending, incidents) without unrestricted exact locations or documents.

### Operator (dispatcher / fleet / compliance)

1. Manage staff memberships, vehicles, service zones, availability, and expiring credentials.
2. Review requests with **masked** locations before acceptance; submit transparent quotes.
3. Assign only eligible drivers and fit-for-purpose vehicles; eligibility is server-enforced.
4. Dispatch and monitor trips; reassign with reason and audit.
5. Maintain prestart, restraint, time, distance, incident, and completion evidence.
6. Create accurate service events and billing records (holds on dispute/incident).

### Driver

1. View only assigned trips and minimum participant information for safe delivery.
2. Complete vehicle prestart; blocked departure on failure when policy requires.
3. Move through the controlled trip state machine with idempotent events.
4. Share location only during an active consented trip window.
5. Record actual time, kilometres, assistance, incidents, and evidence.
6. Work offline-safe with a visible unsynced queue (phase of MVP hardening).

### MapAble admin / compliance

1. Operator verification, credential expiry dashboards, incident/complaint due dates.
2. Audited exact-location and evidence access with reason codes.
3. Feature-flag and production-claim registry; pricing-rule governance.
4. Integration health (routing, TfNSW, notifications) without exposing secrets.

## Truthful product language

Use these participant-facing meanings. Map them to `TransportTripStatus` in Prisma where noted.

| Language | Meaning | Closest current statuses |
|----------|---------|--------------------------|
| **Requested** | Participant submitted a trip request; not yet a confirmed booking | `requested`, open `TransportTripRequest` |
| **Quoting / quote available** | Operator or system produced a price/window that is not yet accepted | *Gap:* no first-class quote entity yet; do not invent “quoted” UI until P2/P6 |
| **Participant confirmed / booked** | Participant accepted a quote; trip exists for fulfilment | `accepted` after provider accept; pack “participant_confirmed” needs quote-accept flow |
| **Assignment pending** | Confirmed trip awaiting eligible driver/vehicle | `dispatch_pending` |
| **Assigned** | Eligible driver and vehicle attached | `driver_vehicle_assigned`, `driver_accepted` |
| **Live / in progress** | Active delivery states | `en_route_to_pickup` → `arrived_at_dropoff` / handover |
| **Completion pending** | Awaiting evidence and/or participant review | `trip_completed`, `evidence_submitted`, `participant_review` |
| **Completed / closed** | Service record settled for ops (billing may still hold) | `closed` |
| **Cancelled / no-show / disputed / recovery** | Terminal or hold paths | `cancelled`, `declined`, `driver_no_show`, `participant_no_show`, `disputed`, `unsafe_to_continue`, `service_recovery_required` |
| **Advisory estimate** | Route/ETA from a routing adapter — not operator-confirmed arrival | `TransportRouteEstimate` + UI “advisory” |
| **Sandbox / pilot** | Deterministic fixtures or limited cohort; not live national supply | `TRANSPORT_ROUTING_PROVIDER=mock`, public Pilot labels |
| **Funding eligibility not verified** | Plan type alone is not coverage | Never render `NDIS Covered` without verified context |

**Booked ≠ assigned.** **Assigned ≠ en route.** **Advisory ETA ≠ confirmed pickup window.**

## MVP vs phase two vs out of scope

### Production MVP path (Prompts 1–15, 18–20 + PC-0–PC-4)

- Route shell and truthful public landing (P1, PC-0).
- Domain gaps: quotes, consents, pricing rules, protected locations, profiles as first-class records (P2).
- Hardened state machine, eligibility, audit (P3, PC-1).
- Authorisation, consent, location privacy (P4).
- Typed API reconciliation (P5).
- Routing/quote adapters with honest sandbox (P6, PC-3).
- Participant profile, request/quote wizard, dashboard/trip detail (P7–P9, PC-2).
- Operator dispatch/fleet and driver field workspace (P10–P11).
- Real-time updates + notification fallbacks (P12).
- Evidence, incidents, complaints, attestations (P13, PC-2).
- Pricing, funding context, invoicing, Stripe/Xero adapters fail-closed (P14).
- Care + Transport bundling without silent auto-book (P15).
- Accessibility, offline, security, retention (P18).
- Test pyramid, CI, pilot fixtures (P19).
- Release readiness and public truth sync (P20, PC-4).

### Phase two (Prompts 16–17)

- Accessible public-transit planning and live alerts (GTFS / GTFS-RT) behind flags.
- Reliability engine, fallback dispatch, coordinator multi-participant view, admin compliance depth.

### Explicitly out of scope (unless a later decision reopens)

- Emergency dispatch or claiming MapAble is a substitute for 000.
- Diagnosis capture as part of the Transport Access Profile.
- Blockchain marketing for attestations.
- Treating mass-transit itineraries as reservations without a partner booking API.
- Destructive big-bang deletion of legacy `TransportBooking` or Care `Booking` rows.
- Promoting production claims from screenshots or local demos alone.

## Non-functional requirements

- WCAG 2.2 AA; keyboard and screen-reader parity; map + list/form equivalent.
- Australian English; UTC storage; `Australia/Sydney` display default.
- Server-side permissions; idempotent retriable writes; append-only trip events.
- Feature flags for external systems; fail closed when misconfigured in production.
- Integer cents for money; versioned pricing rules; no silent GST assumptions.

## Success definition (MVP)

See the pack “Definition of done for the production MVP” and close [`IMPLEMENTATION_CHECKLIST.md`](./IMPLEMENTATION_CHECKLIST.md) only when participant, operator/driver, safety/privacy, and quality gates are met — not merely when forms render.
