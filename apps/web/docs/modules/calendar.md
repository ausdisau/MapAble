# Unified calendar (Phase 3)

## Built
`CalendarEvent` model syncing care, transport, and job events. List view default in UI.

## Routes
`/dashboard/calendar`, `/api/calendar/events`

## Accessibility
Semantic list (`<ol>`), `<time>` elements, screen reader labels.

## Limitations
`CALENDAR_EXTERNAL_SYNC_ENABLED=false` — iCal placeholder only.

## Phase 4
External sync, week grid with keyboard alternatives.
