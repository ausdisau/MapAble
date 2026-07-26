# MapAble Transport — Current State Audit

**Repository:** `ausdisau/mapableau-new`  
**Audit date:** 2026-07-17  
**Scope:** Prompt 0 inspection only — no runtime changes.  
**Stack verified:** Next.js 15.5.7, React 18, Prisma 6.19.2, NextAuth, TanStack Query, Vitest, pnpm (`package.json`).

> Pack assumptions about Vite/Express/Drizzle (`client/src/App.tsx`, `shared/schema.ts`, `server/routes.ts`) **do not apply** to this checkout. Remote is `github.com/ausdisau/mapableau-new`.

---

## 1. Route map (App Router)

### Current routes (evidence)

| Path | File | Role |
|------|------|------|
| `/transport` | [`app/transport/page.tsx`](../../app/transport/page.tsx) | Public marketing landing (`PublicModulePage`) |
| `/transport/new` | [`app/transport/new/page.tsx`](../../app/transport/new/page.tsx) | Redirect → `/dashboard/transport/new` |
| `/dashboard/transport` | [`app/dashboard/transport/page.tsx`](../../app/dashboard/transport/page.tsx) | Participant trip list (auth) |
| `/dashboard/transport/new` | [`app/dashboard/transport/new/page.tsx`](../../app/dashboard/transport/new/page.tsx) | Booking / trip create form |
| `/dashboard/transport/[tripId]` | [`app/dashboard/transport/[tripId]/page.tsx`](../../app/dashboard/transport/[tripId]/page.tsx) | Trip detail + advisory ETA |
| `/dashboard/transport/legacy` | [`app/dashboard/transport/legacy/page.tsx`](../../app/dashboard/transport/legacy/page.tsx) | Legacy `TransportBooking` list |
| `/dashboard/find-transport` | [`app/dashboard/find-transport/page.tsx`](../../app/dashboard/find-transport/page.tsx) | Operator search |
| `/provider/transport` | [`app/provider/(console)/transport/page.tsx`](../../app/provider/(console)/transport/page.tsx) | Provider console |
| `/provider/transport/dispatch` | [`app/provider/(console)/transport/dispatch/page.tsx`](../../app/provider/(console)/transport/dispatch/page.tsx) | Dispatch board |
| `/provider/transport/runs` | [`app/provider/(console)/transport/runs/page.tsx`](../../app/provider/(console)/transport/runs/page.tsx) | Ride runs |
| `/driver/trips` | under `app/driver/trips/` | Driver list |
| `/admin/transport` | [`app/admin/transport/page.tsx`](../../app/admin/transport/page.tsx) | Admin transport |

Middleware: [`lib/community/mapable-peers/peer-middleware.ts`](../../lib/community/mapable-peers/peer-middleware.ts) / [`middleware.ts`](../../middleware.ts) — `/transport` exact public; dashboard/provider/driver protected. **Needs verification:** exact matcher list for `/transport/*` vs public assets.

### Pack target vs current

| Pack route | Current equivalent | Gap |
|------------|-------------------|-----|
| `/transport` public landing | Exists | Public “Available now” copy may over-claim pilot depth (see §5) |
| `/transport/request` | `/dashboard/transport/new` (+ `/transport/new` redirect) | Alias / shell missing |
| `/transport/profile` | Prefill via [`profile-prefill-service.ts`](../../lib/transport/profile-prefill-service.ts) + mobility form | Dedicated profile page missing |
| `/transport/dashboard` | `/dashboard/transport` | Alias missing; dashboard is list-centric |
| `/transport/trips/:id` | `/dashboard/transport/[tripId]` | Alias / role-aware shell incomplete |
| `/transport/operator` | `/provider/transport` (+ dispatch) | Path rename / pack aliases missing |
| `/transport/operator/fleet` | Partial vehicle APIs / provider UI | Dedicated fleet workspace incomplete |
| `/transport/driver` | `/driver/trips` | Path alias + offline field UX incomplete |
| `/admin/transport` | Exists | Compliance depth incomplete vs pack |

[`components/layout/TransportNav.tsx`](../../components/layout/TransportNav.tsx) defines nav links but appears **unused** (DashboardNav used instead).

**Deployed-site vs repository:** Public landing in-repo already distinguishes Available now / Coming soon. Whether production `mapable.com.au` matches this tree **needs verification** against live deploy (not asserted here).

---

## 2. Client components and API calls

### Components (`components/transport/`)

- `NewTransportTripForm.tsx` — `GET /api/transport/mobility-prefill`, `POST /api/transport/trips`
- `MobilityRequirementsForm.tsx`
- `TransportTripListItem.tsx`, `TransportTripStatusBadge.tsx`, `TransportTripActions.tsx`, `TransportTripActionDialogs.tsx` — cancel/confirm/dispute via action hrefs
- `TransportRouteAdvisory.tsx` — displays advisory km/minutes from `routeEstimate`
- `ProviderTripDispatchPanel.tsx`, `ProviderRideRunsPanel.tsx`

### Sampled client → API wiring

| Call site | Endpoint | Handler present |
|-----------|----------|-----------------|
| New trip form | `POST /api/transport/trips` | Yes — `app/api/transport/trips/route.ts` |
| Prefill | `GET /api/transport/mobility-prefill` | Yes |
| Trip actions | `.../cancel\|confirm\|dispute` | Yes |
| Provider dispatch | `/api/provider/transport/trips*` | Yes |
| Legacy accept/decline | `/api/transport/bookings/:id/*` | Yes |

No obvious dead transport endpoints found in the sampled participant/provider paths. Broader unused TfNSW/routing UI surfaces **needs verification**.

---

## 3. Server API inventory

Under `app/api/transport/`:

- Trips: `trips`, `trips/[tripId]`, cancel, confirm, dispute, handover, safety-check
- Legacy bookings: `bookings`, assign-operator/driver/vehicle, accept, decline
- Tracking (legacy id): `[transportBookingId]/tracking/*`, report-delay
- Runs: `runs`, lock, trips
- Routing: `routing/estimate|optimise|matrix|cache/refresh|optimisation-jobs/[jobId]`
- Traffic / Trip Planner: `traffic/*`, `tp/*`
- Prefill: `mobility-prefill`

Also: `app/api/provider/transport/**`, `app/api/driver/transport/trips/**`, orchestration care-transport, `app/api/search/transport`, admin analytics/service-ops.

Domain logic lives in [`lib/transport/`](../../lib/transport/) (27 modules), not a single Express router.

---

## 4. Schema inventory (Prisma)

Source: [`prisma/schema.prisma`](../../prisma/schema.prisma).

### Scheduling domain (preferred)

`TransportTripRequest`, `TransportTrip`, `TransportTripStop`, `TransportTripEvent`, `TransportDriver`, `TransportVehicle`, `TransportVehicleFeature`, `TransportDriverVerification`, `TransportVehicleVerification`, availability, `TransportDispatchAssignment`, schedule conflicts, `TransportRouteEstimate` / segments / optimisation jobs, `TransportLiveLocation`, `TransportEtaEvent`, pickup/dropoff points, `TransportSafetyCheck`, `TransportTripEvidence`, handover, safety events, `TransportIncidentLink`, `RideRun`.

`TransportTripStatus` includes rich lifecycle (`requested` → `closed` / `disputed` / `service_recovery_required`, etc.). Transitions enforced via [`lib/transport/transport-status-service.ts`](../../lib/transport/transport-status-service.ts) + [`lib/platform/av-framework/trip-transitions`](../../lib/platform/av-framework/).

### Legacy / parallel

- `TransportBooking`, `Vehicle`, `DriverProfile` (Phase 3)
- Generic `Booking` (`care` | `transport` | `care_transport`) + segments/timeline
- Bridge: [`lib/transport/booking-bridge-service.ts`](../../lib/transport/booking-bridge-service.ts)

### Pack entities missing or incomplete

| Pack entity | Status |
|-------------|--------|
| `transport_profiles` first-class | Partial — mobility JSON + prefill; no dedicated profile table |
| `transport_operators` / members | Partial — `Organisation` + permissions; no dedicated operator membership enum matrix |
| `transport_quotes` | **Missing** as first-class model |
| `transport_locations` encrypted | **Missing** — addresses stored as plaintext strings on trip/request (`pickupAddress`, lat/lng floats) |
| `transport_consents` transport-scoped | Partial — generic consent (`transport.trip_access`, accessibility share) |
| `transport_pricing_rules` | **Missing** |
| `vehicle_prestart_checks` | Partial — `TransportSafetyCheck` exists; full prestart checklist UX **needs verification** |
| Immutable eligibility snapshot on assignment | Partial — eligibility service exists; snapshot persistence depth **needs verification** |

---

## 5. Hard-coded prices, funding badges, demo values

| Finding | Evidence | Severity |
|---------|----------|----------|
| No `NDIS Covered` / `Companion Card` / `$25.50` / `$42.00` / `$4.80` strings | Repo-wide search (2026-07-17) | Cleared for those pack issues |
| NDIS disclaimer (honest) | [`app/dashboard/transport/new/page.tsx`](../../app/dashboard/transport/new/page.tsx) — estimates not payment approval | OK |
| Mock routing default | [`lib/config/transport-routing.ts`](../../lib/config/transport-routing.ts) — `TRANSPORT_ROUTING_PROVIDER` defaults to `"mock"`; mock duration ≈ distance/8 m/s in `lib/transport/routing/mock-routing-adapter.ts` | Risk if production omits env and still shows estimates without sandbox label |
| Public landing “Available now” includes signed-in pilot routes | [`app/transport/page.tsx`](../../app/transport/page.tsx) L22–26 | Must not promote verification/live status/routing as available (Coming soon lists them — OK); pilot wording accuracy **needs verification** vs deploy flags |
| Pilot copy: “Live GPS tracking is not available” | [`app/dashboard/transport/page.tsx`](../../app/dashboard/transport/page.tsx) L19–20 | Honest for live GPS |

---

## 6. Privacy and address exposure

| Finding | Evidence |
|---------|----------|
| Role-shaped access levels `none` \| `summary` \| `exact` | [`lib/transport/transport-access-policy.ts`](../../lib/transport/transport-access-policy.ts) |
| Participant and admin get `exact`; family needs `transport.trip_access` consent for `summary` | Same file |
| Provider org with transport permissions gets `exact` once `providerOrganisationId` set | May be earlier than pack’s “only after quote acceptance” — **gap** |
| Driver gets `exact` when actively assigned | Active status set includes pre-start through handover |
| Exact addresses stored unencrypted on trip rows | `TransportTrip.pickupAddress` / coords in schema |
| Data access logging exists | [`lib/transport/data-access-log-service.ts`](../../lib/transport/data-access-log-service.ts) |

---

## 7. Eligibility, events, evidence

| Capability | Location | Gap vs pack production claim |
|------------|----------|------------------------------|
| Driver/vehicle verification checks | [`lib/transport/transport-eligibility-service.ts`](../../lib/transport/transport-eligibility-service.ts) | Public claim still “Coming soon”; promote only via PC-1 gates |
| Vehicle suitability | [`lib/transport/vehicle-suitability.ts`](../../lib/transport/vehicle-suitability.ts) | Missing measurements → reasons; manual-review UX incomplete |
| Assignment | [`lib/transport/transport-assignment-service.ts`](../../lib/transport/transport-assignment-service.ts) | Confirm fail-closed in same transaction **needs verification** |
| Trip events | [`lib/transport/transport-event-service.ts`](../../lib/transport/transport-event-service.ts) | Idempotency / compensating events depth **needs verification** |
| Evidence | [`lib/transport/transport-evidence-service.ts`](../../lib/transport/transport-evidence-service.ts) | Private storage + retention policy incomplete vs pack |
| Incidents | `lib/incidents/*` + `TransportIncidentLink` | Full hold/billing matrix incomplete |

---

## 8. Integrations and feature flags

| Integration | Config / code | Notes |
|-------------|---------------|-------|
| Routing | `TRANSPORT_ROUTING_*`, OSRM/GraphHopper/ORS keys | Fail/unavailable behaviour must stay honest |
| TfNSW traffic / trip planner | `TFNSW_*` env; `app/api/transport/traffic|tp` | Provider-facing; not participant reservation |
| Live tracking flag | Documented `TRANSPORT_LIVE_TRACKING_ENABLED` in module docs | Dashboard states GPS not in pilot |
| Booking bridge / pooling | `TRANSPORT_BOOKING_BRIDGE_ENABLED`, `TRANSPORT_RIDE_POOLING_ENABLED` | Documented in transport-scheduling.md |
| Stripe / Xero | Existing billing-core | Not transport-specific quote→invoice yet |
| Production claim registry | **Missing** | PC-0 |

---

## 9. Auth, audit, notifications (reuse)

- Auth: `lib/auth/*`, `lib/api/auth-handler.ts`, NextAuth
- Audit: `lib/audit/audit-event-service.ts`
- Notifications: `lib/notifications/notification-service.ts`
- Permissions: `lib/auth/permissions.ts` (`transport:manage:org`, `transport:drive`, etc.)

---

## 10. Tests and docs

- Tests: `tests/transport-scheduling-routing.test.ts`, `tests/tfnsw-traffic.test.ts`, `tests/av-framework.test.ts` (and related)
- Docs: `docs/modules/transport.md`, `docs/modules/transport-scheduling.md`, `docs/accessible-ride-share.md`, `docs/tfnsw-traffic.md`, `docs/av-mcp.md`
- No prior `docs/transport/` tree before Prompt 0
- No `.cursor/rules/` before Prompt 0 (only hooks/mcp)

### Verification commands (this repo)

```bash
pnpm type-check
pnpm build
pnpm test -- tests/transport-scheduling-routing.test.ts
```

There is **no** `npm run check` script; use `pnpm type-check` (+ `pnpm lint` / `pnpm prepush` as needed).

---

## 11. Verified gap list (summary)

1. **Dual domain models** — legacy `TransportBooking` + scheduling `TransportTrip` + generic `Booking` bridge; migration story must stay non-destructive.
2. **Route aliases** — pack paths (`/transport/request`, `/transport/profile`, `/transport/operator`, `/transport/driver`) not present; dashboard/provider/driver paths used instead.
3. **No first-class quotes or pricing rules** — cannot truthfully run quote-accept → booking without new models/APIs.
4. **Plaintext exact addresses** on trip/request rows; provider may see exact earlier than pack’s post-acceptance rule.
5. **No dedicated Transport Access Profile page/table** — mobility JSON + prefill only.
6. **Mock routing default** — production misconfiguration risk if estimates are not labelled sandbox.
7. **Public capability status hard-coded** in landing page — needs server claim registry (PC-0).
8. **Production claims** for verification, trip evidence/review, and routing remain unpromoted (landing Coming soon) — keep until PC gates pass.
9. **Unused TransportNav** — dead UI surface.
10. **Realtime / offline driver queue / versioned billing** — incomplete relative to pack MVP.
11. **Deployed public site vs this branch** — needs verification.

Items marked **needs verification** must be confirmed with runtime tests or production config inspection in later prompts — not assumed fixed by documentation.
