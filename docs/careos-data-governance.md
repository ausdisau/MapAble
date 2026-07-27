# CareOS data governance

## Data classification

| Class | Examples | CareOS handling |
|-------|----------|-----------------|
| Operational | Bookings, shifts, transport trips | Read via domain services; recommend only |
| Personal | Name, contact, preferences | Minimum necessary; consent-scoped |
| Health-related | Support plans, progress notes | Redact in audit/notifications; human review queues |
| Financial | Invoices, plan budgets | Authority-gated; no auto-settlement |
| Credentials | Worker checks, WWCC | Eligibility gates; never fake verification |

## Retention and deletion

CareOS audit records follow MapAble `AuditEvent` retention. Participant deletion requests propagate through existing privacy services; CareOS does not maintain a shadow store.

## Redaction

`redactCareOSMetadata` removes credentials, tokens, payment data, unnecessary health details, and long raw strings before audit storage. Notification previews use `redactNotificationPreview` — no clinical content in email subject/preview.

## Tenant isolation

Cloud events and missions carry `tenantId`. Cross-tenant reads are forbidden at API and persistence layers.

## Research and exports

Research-safe-room and de-identification pipelines (`lib/platform/privacy/`) are separate from operational CareOS paths. CareOS must not bypass small-cell controls or export approval workflows.

## Quarantine and SoR

Until Task A completes, do not merge fabric mission data into tip tables via raw SQL. Single mission SoR prevents forked participant histories.

## Breach response

1. Disable CareOS: `MAPABLE_CAREOS_ENABLED=false`
2. Preserve audit evidence
3. Assess affected request/trace IDs
4. Restore only after human review (`docs/careos/AUDIT_AND_PRIVACY.md`)
