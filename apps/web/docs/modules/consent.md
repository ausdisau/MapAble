# Consent model (Phase 1)

## Scopes

Dot-notation in API (`profile.read`) maps to Prisma enums (`profile_read`). See `lib/consent/scope-map.ts`.

## Service functions

- `grantConsent` — creates record + audit event
- `revokeConsent` — immediate status change + audit event
- `checkConsent` — used before sharing accessibility with organisations
- `listConsentsForParticipant`

## Routes

- `/dashboard/consent`, `/dashboard/consent/new`, `/dashboard/consent/[id]`
- `/admin/consents`
- `POST /api/consents`, `POST /api/consents/:id/revoke`

## Phase 2

Consent templates, expiry automation, and support coordinator delegated grants.
