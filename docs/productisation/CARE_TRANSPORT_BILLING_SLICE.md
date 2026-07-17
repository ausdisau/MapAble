# Care · Transport · Billing evidence slice

Flags remain default **off** for pilots; these APIs are available behind auth.

## Care

- `GET/POST /api/care/bookings/[id]/agreement` — accessible service agreement (versioned, plain-language, participant acceptance)
- `POST /api/care/bookings/[id]/billing-handoff` — confirmed service log → `BillingServiceRecord` (idempotent)
- Legacy `invoice-placeholder` retained for compatibility

## Transport

- `POST /api/transport/quotes` — first-class versioned quote (Prisma `TransportQuote` + versions)
- `GET /api/transport/quotes/[id]` — participant or org transport staff (cross-tenant → 404)
- `POST /api/transport/quotes/[id]/accept` — participant acceptance
- `lib/transport/privacy/location-disclosure.ts` — staged exact-address disclosure
- `POST /api/transport/trips/[tripId]/billing-handoff` — completed trip → `BillingServiceRecord`

## Hard rules

- No NDIA live submit
- No funding approval implied by quote or handoff
- Pricing remains unresolved (`estimatedCents: 0`) until versioned policy applied
- Route-found ≠ completed outcome
- GPS check-in never required for care agreements

## Rollback

Revert quote service/routes and migration `20260717150000_transport_quotes_persistent` if needed.
BillingServiceRecords remain (idempotent source keys).
