# Safety & incident management centre

Participant-facing hub for formal incident reports and general support tickets. Mirrors the billing centre pattern under `/dashboard/safety`.

## Routes

| Path | Purpose |
|------|---------|
| `/dashboard/safety` | Overview and entry cards |
| `/dashboard/safety/incidents` | List incident reports |
| `/dashboard/safety/incidents/new` | Submit a concern |
| `/dashboard/safety/incidents/[incidentId]` | Report detail and updates |
| `/dashboard/safety/support` | List support tickets |
| `/dashboard/safety/support/new` | Create a ticket |
| `/dashboard/safety/support/[ticketId]` | Ticket detail and comments |

Legacy paths redirect:

- `/dashboard/incidents` → `/dashboard/safety/incidents`
- `/dashboard/support` → `/dashboard/safety/support`

## APIs

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/incidents` | List uses `participantId` OR `reportedById`; POST sets `participantId` for participant role |
| GET/PATCH | `/api/incidents/[incidentId]` | GET enforces access; PATCH `action: submit` for participants |
| GET/POST | `/api/support/tickets` | Tickets scoped to creator or participant |
| GET | `/api/support/tickets/[ticketId]` | Non-internal comments for participants |

## Safeguarding

- Incident and ticket flows **do not** auto-submit to the NDIS Commission.
- Critical / safeguarding flags notify admins and may create `ndisRuleWarning` records for human review.
- Public constitutional content remains at `/safeguards`.
- Admin triage: `/admin/incidents`.

## Components

- `components/safety/SafetyCentreNav.tsx` — section navigation
- `components/safety/SafetyIncidentDetailClient.tsx`
- `components/safety/SafetySupportTicketDetailClient.tsx`
- `lib/safety/incident-access.ts`, `support-access.ts`, `incident-status-labels.ts`
