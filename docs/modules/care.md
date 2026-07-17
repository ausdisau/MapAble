# Care module (MapAble Care)

**Maturity:** merged_but_flagged / controlled_pilot grade — not production_supported.  
**Lane:** MapAble Network (facilitation) — not Managed Support unless a separately registered entity delivers.

## Built

- Participant care request form at `/care/request`
- Provider care request inbox at `/provider/care/requests`
- Provider accept/decline (care request + care booking APIs)
- Manual worker assignment with eligibility and high-intensity competency gates
- Worker portal: `/worker/today`, `/worker/shifts/[id]` with shift status stepper
- Access needs and support tasks summaries
- **Accessible service agreements** (versioned, plain-language, participant acceptance) via
  `GET/POST /api/care/bookings/[id]/agreement` — see `docs/productisation/CARE_TRANSPORT_BILLING_SLICE.md`
- Service log create/submit, participant confirm/dispute
- **Evidence billing handoff** — confirmed service log → `BillingServiceRecord` via
  `POST /api/care/bookings/[id]/billing-handoff` (idempotent)
- Legacy `invoice-placeholder` retained for compatibility (pricing stub; not funding approval)
- Incident/concern report with optional Quality & Safeguards Centre escalation
- Role-aware and consent-aware access control with audit events on status changes
- Backup shift recovery links (Care-local; mission Continuity is a later programme wave)

## Routes

| Audience | Routes |
|----------|--------|
| Participant | `/care`, `/care/find`, `/care/request`, `/care/bookings`, `/care/bookings/[id]`, `/care/service-logs` |
| Provider | `/provider/care`, `/provider/care/requests`, `/provider/care/roster`, `/provider/care/bookings/[id]`, `/provider/care/service-logs` |
| Worker | `/worker/today`, `/worker/shifts/[id]`, `/worker/service-log`, `/worker/report-issue` |

Legacy redirects: `/dashboard/care/*` → `/care/*`

## APIs

- `GET/POST /api/care/bookings`, `GET /api/care/bookings/[id]`
- `POST /api/care/bookings/[id]/accept|decline|assign-worker|invoice-placeholder`
- `GET/POST /api/care/bookings/[id]/agreement` — versioned accessible agreement + participant acceptance
- `POST /api/care/bookings/[id]/billing-handoff` — evidence → `BillingServiceRecord`
- `GET/POST /api/care/service-logs`, `POST .../confirm`, `POST .../dispute`
- `POST /api/care/incidents`, `POST /api/care/incidents/[id]/escalate-qsc`
- Existing: `/api/care/requests`, `/api/care/shifts`, recovery routes under `/api/care/recovery`

## Database tables

Prisma models mapped with `@@map` to: `care_requests`, `care_bookings`, `care_booking_events`,
`care_booking_workers`, `care_roster_assignments`, `care_service_agreements`, `care_service_logs`,
`care_progress_notes`, `care_participant_preferences`, `care_worker_preferences`, `care_access_needs`,
`care_risk_flags`, `care_living_alone_safeguards`, `care_shift_cancellations`,
`care_service_recovery_links`, `care_invoice_links`, backup shift recovery models.

## Privacy

Accessibility details require consent (`care.accessibility_share`), including organisation-scoped
checks for providers. GPS check-in is never required for agreements.

## Discovery → care request

NDIS Provider Finder outlets can link to a platform `Organisation` when:

1. **ABN match** — outlet ABN matches an active organisation ABN
2. **Registry slug / outlet key** — `providerOutletRegistry` row resolves to an ABN that matches an active organisation

When linked, profile and finder cards show **Request care** → `/care/request?organisationId=…&providerName=…` with wizard prefill banner.

## Recurring schedules (flagged)

Flag: `MAPABLE_CARE_RECURRING_SCHEDULES_ENABLED` (default **false**).

- `GET/POST /api/care/bookings/[id]/schedules` — draft weekly/fortnightly cadence
- `POST /api/care/schedules/[scheduleId]/activate` — optional agreement amend
- `POST /api/care/schedules/[scheduleId]/exceptions` — skip / reschedule one occurrence
- Materialisation creates `CareShift` rows with `recurringScheduleId` + `occurrenceDate`
- Agreement SoT remains `CareServiceAgreement` on the booking (amend bumps version)
- `POST /api/care/bookings/[id]/agreement/amend` — version bump; participant re-accepts
- Shift cancel via `cancelCareShiftWithRecoveryHook` records cancellation and **does not**
  auto-cancel connected Transport

## Limitations / honesty

- No AI matching or automatic worker assignment
- Recurring schedules require the feature flag; not production_supported
- NDIS pricing is unresolved until versioned pricing policy — no funding approval claims
- Billing handoff creates `BillingServiceRecord`; it does not submit to NDIA
- Cancel Care must not silently cancel connected Transport (Continuity PR 5)

## Tests

`tests/care-mvp.test.ts` — permissions, worker eligibility, participant access helpers.  
Care↔Billing adapters under `tests/**/care-transport-billing*`.

## Related

- `docs/productisation/CARE_TRANSPORT_BILLING_SLICE.md`
- `docs/productisation/CAPABILITY_REGISTRY.md`
- `docs/strategy/OPERATING_LANES.md`
