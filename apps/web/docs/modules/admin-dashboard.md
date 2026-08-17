# Admin dashboard (Phase 1)

## Access

Only users with `primaryRole` of `mapable_admin` (see `lib/auth/guards.ts` `requireAdmin`).

## Sections

- Metrics on `/admin`
- Searchable participants, organisations, bookings
- Consent and notification oversight
- Audit event log with action filter

## Audit

Sensitive participant/accessibility views call `logAdminSensitiveAccess`. Organisation verification changes log `organisation.verification_changed`.

## Phase 2

System alerts, incident queue, and bulk provider verification tools.
