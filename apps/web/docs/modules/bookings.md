# Bookings foundation (Phase 1)

## Types

`care`, `transport`, `care_transport` with statuses from `draft` through `disputed`.

## Wizard

`/dashboard/bookings/new` — 5-step flow: type → time → details → consent/accessibility → review.

## Linked bookings

`care_transport` uses `BookingSegment` for care and outbound transport with buffer minutes. `BookingTimeline` renders the sequence.

## Admin

Manual assignment of organisation and status at `/admin/bookings/[id]`.

## Phase 2

Provider acceptance workflow, recurring bookings, routing, and live ETA.
