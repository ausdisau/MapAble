# Mobile Screen Map

## Current unified native client

`apps/mobile` currently implements the AdaptAble / Independence Suite prototype with these primary areas:

- Today / My Day
- AdaptAble Home
- Indy
- MapAble accessible-place search
- AccessiBooks prototype
- Disability News & Advocacy prototype
- My Access preferences
- Permissions
- Activity
- Support boundaries

The first live cross-app slice is MapAble accessible-place search. Other capability cards remain prototype experiences unless their backing service is explicitly connected and verified.

## Planned authenticated role expansion

### Participant
- profile
- accessibility preferences
- bookings
- care request
- transport booking
- trip tracking
- calendar
- messages
- documents
- invoices
- support tickets
- incidents

### Worker
- assigned shifts
- shift detail
- check-in/out
- timesheet
- messages

### Driver
- assigned trips
- trip detail
- status buttons
- delay/issue report

### Provider admin
- bookings
- care requests
- transport
- workers
- vehicles
- invoices

## Interaction rules

All screens should use list-first or task-first layouts with plain-language status text. High-impact actions require deterministic permission checks, clear data-use disclosure and explicit user confirmation where appropriate. Prototype content must not be presented as live service data.
