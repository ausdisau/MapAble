# Privacy and audit (Phase 1)

## Privacy controls

- NDIS participant numbers encrypted at rest (`lib/crypto/ndis.ts`)
- No sensitive fields in audit metadata keys matching `ndis|password|secret`
- Consent required before organisation accessibility share on bookings
- Admin notes on participant profiles admin-only

## Audit events

Immutable `AuditEvent` records via `lib/audit/audit-event-service.ts`. Actions include profile, consent, organisation, and booking lifecycle events.

## API

`GET /api/admin/audit-events` — admin only

## Phase 2

Export for NDIS Quality and Safeguards evidence packs, retention policies, and participant data export/erasure workflows.
