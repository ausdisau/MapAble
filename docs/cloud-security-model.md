# CareOS cloud security model

## Trust boundaries

- Authentication establishes the actor only; participant authority and tenant
  membership are evaluated separately.
- Tenant context is resolved server-side from memberships and workspaces.
- Participant authority grants are purpose/action scoped, expiring, revocable
  and audited.
- Organisation membership never grants implicit participant authority.
- CareOS remains capped at L2 recommendation/simulation. Safeguarding,
  clinical, eligibility and payment decisions are human-only.

## Events and workflows

Events are appended to PostgreSQL in the same transaction as domain state.
Outbox records carry tenant, participant, mission, correlation, causation and
trace identifiers. Relay retries are bounded and dead-letter after five
attempts. Event payloads must exclude raw participant narratives and secrets.

Workflows support cancellation, retry, participant-confirmation pause and
human-review pause. Workflow status does not itself authorise a domain action.

## Documents

Documents are private by default and require participant, organisation or
tenant ownership. Malware scanning must return `clean` before storage metadata
is created. Access grants expire and can be revoked. Signed URLs are limited to
15 minutes. Permanent public object URLs are prohibited.

## Incident controls

Global CareOS and cloud automation feature flags provide kill switches.
Ordinary non-AI service pathways remain available during degradation.
Production recording providers are rejected by typed environment validation.
