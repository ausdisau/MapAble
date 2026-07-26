# Communication → Workforce vertical slice

Flags (default **false**):

- `MAPABLE_COMMUNICATION_PASSPORT_ENABLED`
- `MAPABLE_WORKFORCE_READINESS_ENABLED`

## Canonical owners

| Concern | Owner |
| --- | --- |
| Communication instructions | Projection over `AccessibilityProfile` |
| Disclosure authority | `ConsentRecord` / consent service |
| Worker acknowledgement | `AuditEvent` (`communication_passport.acknowledged`) |
| Readiness evaluation | `lib/workforce/readiness` (deterministic reasons) |
| Assignment | **Human only** — `autoAssignmentEnabled` permanently false |

## APIs

- `GET/PUT /api/communication-passport`
- `POST /api/communication-passport/acknowledge`
- `POST /api/workforce/readiness`

## Non-goals

- Auto-assignment / worker ranking / AI certification
- Academy completion as competency
- New participant or worker source of truth
