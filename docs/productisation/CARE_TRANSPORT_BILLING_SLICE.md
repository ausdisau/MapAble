# Care · Transport · Billing evidence slice

Flags remain default **off** for pilots; these APIs are available behind auth.

## Care

- `GET/POST /api/care/bookings/[id]/agreement` — accessible service agreement (versioned, plain-language, participant acceptance)
- `POST /api/care/bookings/[id]/billing-handoff` — confirmed service log → `BillingServiceRecord` (idempotent)
- Legacy `invoice-placeholder` retained for compatibility

## Transport

- `POST /api/transport/quotes` — first-class versioned quote (process-local until Prisma Prompt 2)
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

Revert this PR. Process-local quotes clear on process restart; BillingServiceRecords remain (idempotent source keys).
