# Centralised MapAble Core Control Plane — Technical Specification

**Status:** Proposed implementation architecture  
**Date:** 2026-09-20  
**Repository:** `ausdisau/MapAble`  
**Base:** `main` @ `b51cb9b73395769c46c3f64dd6094120bc2cedac`  
**Branch:** `architecture/centralised-mapable-core-control-plane`

## 1. Decision

Centralise **platform control, administration and moderation** in MapAble Core without collapsing domain-owned data into a new monolithic database.

MapAble Core becomes the shared control plane for:

- identity and tenancy context;
- permissions, participant authority and consent;
- admin work queues;
- moderation orchestration;
- module/capability visibility;
- audit and action receipts;
- notification and human escalation;
- standard API versioning, response and request context.

Existing domains remain authoritative for their own records:

- Care -> `lib/care/**`
- Transport -> `lib/transport/**`
- Access -> existing `lib/access*` owners
- Incidents -> `lib/incidents/**`
- Support tickets -> `lib/support/**`
- Engagement/complaints -> existing engagement services/models
- Billing -> `lib/billing/**`
- Provider quality -> `lib/provider/quality/**`

The centralisation target is the **control plane and operational view**, not a replacement source of truth.

## 2. Evidence ledger

| Item | Status | Evidence | Confidence | Consequence |
|---|---|---|---|---|
| Next.js + Prisma + PostgreSQL are the canonical stack | Verified in current repo | `apps/web`, `prisma/schema.prisma`, current docs | High | Reuse existing stack; no new backend framework |
| `Organisation.id` is the tenancy source of truth | Declared and enforced direction | `docs/remediation/DOMAIN_OWNERSHIP.md` | High | Tenant context must be server-derived |
| `ConsentRecord` is canonical for consent | Verified current ownership | `lib/consent/**`, domain map | High | No second consent ledger |
| `AuditEvent` is canonical for platform audit | Verified current ownership | `lib/audit/**`, canonical domain registry | High | Core admin/moderation writes emit through audit service |
| `ParticipantAuthorityGrant` + `AuthorityDecision` already exist | Verified current repo | authority services/tests | High | Central API must wrap, not replace, participant authority |
| Incident reporting is canonical in `lib/incidents/**` | Verified current ownership | domain ownership + API routes | High | Admin queue references incidents; does not absorb them |
| Support tickets are canonical in `lib/support/**` | Verified current services/routes | `lib/support/ticket-service.ts` | High | Queue projection only |
| Complaints/feedback already have engagement workflow | Verified current docs/routes | `docs/modules/engagement.md` | High | Central admin surfaces should integrate, not fork |
| Access has its own moderation queue today | Verified current services/pages | `AccessModerationQueue`, admin Access pages | High | Migrate to Core moderation through adapter, not destructive rewrite |
| ConvergenceOS already owns domain/capability truth | Verified current repo | `lib/platform/convergence-os/**` | High | Core admin should read this registry instead of inventing another |
| Admin command centre already exists | Verified current page/permissions | `app/admin/page.tsx`, `admin:command-centre:read` | High | Extend existing admin shell |

## 3. Design principle

> **Centralise governance and orchestration; preserve domain ownership.**

A central control plane is useful only if it reduces duplication. It must not become a second Care, Transport, Access, Incident, Complaint or Billing implementation.

No Core service may directly mutate a foreign domain aggregate table. A Core admin action calls the owning domain service.

## 4. Target architecture

```text
Participant / Provider / Admin / Mobile
               |
               v
        Versioned API surface
  /api/v1/core
  /api/v1/admin
  /api/v1/moderation
               |
               v
      MapAble Core Control Plane
  +-------------------------------+
  | API Context / Tenant Resolver |
  | Permissions / Authority       |
  | Consent                       |
  | Admin Queue                   |
  | Moderation Orchestrator       |
  | Capability / Domain Registry  |
  | Audit / Notifications         |
  +-------------------------------+
               |
               v
       Domain Adapter Boundary
  +------+------+------+----------+
  | Care | Transport | Access ... |
  +------+------+------+----------+
               |
               v
       Canonical domain services
               |
               v
          Prisma/PostgreSQL
```

## 5. New Core package boundary

Create:

```text
apps/web/lib/platform/core/
  api/
    request-context.ts
    response.ts
  admin/
    work-item-types.ts
    work-item-service.ts
    work-item-projection.ts
    source-adapter.ts
    adapters/
      access.ts
      incidents.ts
      support.ts
      engagement.ts
      provider-quality.ts
  moderation/
    moderation-service.ts
    moderation-policy.ts
    moderation-types.ts
  registry/
    module-registry.ts
    capability-view.ts
  index.ts
```

This package is a façade/orchestration layer. It must call existing canonical owners:

- `lib/auth/**`
- `lib/consent/**`
- `lib/authority/**`
- `lib/audit/**`
- `lib/incidents/**`
- `lib/support/**`
- domain-specific service packages.

## 6. API request context

Introduce one request-context resolver for all new v1 routes.

```ts
export type CoreApiContext = {
  user: CurrentUser;
  correlationId: string;
  organisationIds: string[];
  activeOrganisationId?: string;
  participantId?: string;
  permissions: Permission[];
  source: "web" | "mobile";
};
```

Rules:

1. Authentication reuses existing session/mobile bearer helpers.
2. Organisation scope is derived server-side.
3. Client-supplied organisation IDs never grant authority.
4. Participant scope requires self-authority or explicit participant authority grant.
5. Every mutating v1 request gets a correlation ID.
6. Correlation IDs are propagated to audit and work-item events.
7. Sensitive access reasons must be explicit where existing domain policy requires them.

## 7. Versioned API surface

### 7.1 Core

```text
GET  /api/v1/core/me
GET  /api/v1/core/modules
GET  /api/v1/core/capabilities
GET  /api/v1/core/organisations
GET  /api/v1/core/participants/me/summary
GET  /api/v1/core/authority
GET  /api/v1/core/consents
```

These are read façades over existing canonical systems.

### 7.2 Admin

```text
GET  /api/v1/admin/overview
GET  /api/v1/admin/work-items
GET  /api/v1/admin/work-items/:id
POST /api/v1/admin/work-items/:id/claim
POST /api/v1/admin/work-items/:id/transition
POST /api/v1/admin/work-items/:id/release
```

### 7.3 Moderation

```text
GET  /api/v1/moderation/cases
GET  /api/v1/moderation/cases/:id
POST /api/v1/moderation/cases/:id/decision
POST /api/v1/moderation/cases/:id/escalate
```

The moderation routes use the same underlying admin work-item service with moderation-specific policy checks.

## 8. API response contract

New `/api/v1/**` endpoints use a stable envelope.

Success:

```json
{
  "data": {},
  "meta": {
    "correlationId": "..."
  }
}
```

Error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  },
  "meta": {
    "correlationId": "..."
  }
}
```

Existing APIs remain backward compatible and are not migrated in one step.

## 9. Database strategy

### 9.1 Keep existing canonical tables

Do not replace:

- `User`
- `Organisation`
- `OrganisationMember`
- `ParticipantProfile`
- `AccessibilityProfile`
- `ConsentRecord`
- `ParticipantAuthorityGrant`
- `AuthorityDecision`
- `AuditEvent`
- `SupportTicket`
- `IncidentReport`
- `EngagementSubmission`
- `CareShift`
- `TransportTrip`
- `AccessPlace`
- provider-quality / safeguard records.

### 9.2 Add a central operational queue projection

Add:

```prisma
enum AdminWorkItemKind {
  moderation
  support
  complaint
  incident
  provider_verification
  safeguarding
  credential_review
  data_quality
  billing_exception
  platform_operations
}

enum AdminWorkItemStatus {
  open
  triage
  assigned
  waiting_on_participant
  waiting_on_provider
  waiting_on_external
  resolved
  dismissed
}

enum AdminWorkItemPriority {
  low
  normal
  high
  urgent
  critical
}

model AdminWorkItem {
  id                String                @id @default(cuid())
  dedupeKey         String                @unique
  kind              AdminWorkItemKind
  status            AdminWorkItemStatus   @default(open)
  priority          AdminWorkItemPriority @default(normal)

  sourceDomain      String
  sourceEntityType  String
  sourceEntityId    String
  reasonCode        String

  organisationId    String?
  participantId     String?
  assignedToUserId  String?

  dueAt             DateTime?
  resolvedAt        DateTime?
  resolutionCode    String?
  sourceUpdatedAt   DateTime?
  correlationId     String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  events            AdminWorkItemEvent[]

  @@index([status, priority, createdAt])
  @@index([kind, status])
  @@index([organisationId, status])
  @@index([participantId, status])
  @@index([assignedToUserId, status])
  @@index([sourceDomain, sourceEntityType, sourceEntityId])
}

model AdminWorkItemEvent {
  id              String   @id @default(cuid())
  workItemId      String
  actorUserId     String?
  eventType       String
  fromStatus      String?
  toStatus        String?
  reasonCode      String?
  correlationId   String?
  metadataJson    Json?
  createdAt       DateTime @default(now())

  workItem AdminWorkItem @relation(fields: [workItemId], references: [id], onDelete: Cascade)

  @@index([workItemId, createdAt])
}
```

### 9.3 Privacy rule for the queue

The central queue stores **references and workflow metadata**, not full sensitive domain content.

It must not copy:

- incident narratives;
- complaint narratives;
- precise location;
- medical information;
- NDIS numbers;
- full support notes;
- message bodies;
- document content.

Detailed content is resolved on demand through the owning domain adapter after permission checks.

## 10. Admin work source adapters

Each source implements:

```ts
export interface AdminWorkSourceAdapter {
  sourceDomain: string;

  listCandidates(input: {
    organisationIds: string[];
    cursor?: string;
    limit: number;
  }): Promise<AdminWorkCandidate[]>;

  getDetail(input: {
    sourceEntityType: string;
    sourceEntityId: string;
    context: CoreApiContext;
  }): Promise<AdminWorkDetail>;

  applyAction?(input: {
    sourceEntityType: string;
    sourceEntityId: string;
    action: string;
    reasonCode?: string;
    context: CoreApiContext;
  }): Promise<AdminWorkActionResult>;
}
```

Initial adapters:

1. Access moderation
2. Incidents
3. Support tickets
4. Engagement complaints
5. Provider safeguard / quality reviews

Later adapters may cover billing exceptions, credential expiry and platform operations.

## 11. Moderation architecture

Moderation is a specialised admin workflow.

```text
Domain detects issue
   |
   v
Core creates/upserts AdminWorkItem
   |
   v
Moderator claims item
   |
   v
Core loads detail through domain adapter
   |
   v
Moderator decides
   |
   v
Core validates permission + policy
   |
   v
Owning domain service applies change
   |
   v
Work item event + AuditEvent + notification
```

### Moderation rules

- No automatic blocking from AI-only inference.
- AI may classify/tag/prioritise only when labelled as inferred.
- Human decision is required for removal, suspension, provider/worker restriction, content rejection, or safety-critical moderation.
- Unknown evidence remains unknown.
- A moderation decision cannot grant participant authority.
- Moderator access is least-privilege and tenant-scoped.
- Every decision has a reason code and audit event.

## 12. Access moderation migration

Current Access moderation remains operational while the Core queue is introduced.

Migration path:

1. Read existing `AccessModerationQueue` through an adapter.
2. Project each pending Access item into `AdminWorkItem`.
3. Keep Access record as the detailed source of truth.
4. New Access moderation writers call the Core queue service after their canonical Access write.
5. Once parity is proven, stop creating new standalone Access queue-only admin flows.
6. Preserve historical Access moderation records.

No destructive migration is required for the first release.

## 13. Incidents, complaints and support

Do not combine these domain concepts.

- `IncidentReport` remains an incident.
- `SupportTicket` remains a support ticket.
- Engagement complaints remain complaint/feedback records.
- A single user event may legitimately create linked queue items in more than one domain.

The central admin queue is a **work coordination projection**, not a semantic merger.

## 14. Module and capability management

Do not create a second module/capability truth source.

Core API reads from:

- `app/lib/modules.ts`
- ConvergenceOS canonical domain registry
- ConvergenceOS capability catalogue
- public-claim registry
- feature-flag configuration

Admin UI presents:

- module name;
- owner;
- maturity;
- feature flag state;
- public claim state;
- operational health where available;
- open admin work-item counts.

The UI must distinguish `enabled`, `implemented`, `pilot`, and `production_ready`.

## 15. Permissions

Add narrow permissions rather than broad admin bypasses:

```text
admin:work-items:read
admin:work-items:claim
admin:work-items:transition
admin:moderation:read
admin:moderation:decide
admin:moderation:escalate
admin:platform-registry:read
```

Existing `admin:command-centre:read` remains the shell entry permission.

Domain-specific permissions remain required for sensitive detail/action.

A user must satisfy both:

1. Core admin permission; and
2. domain access policy.

## 16. Admin command centre

Extend the existing Admin Dashboard into one operational landing surface.

Primary sections:

- Needs attention
- Moderation
- Incidents & safeguarding
- Complaints & support
- Provider / credential reviews
- Billing exceptions
- Data quality
- Platform capability status
- Audit & recent high-impact actions

Filters:

- priority;
- status;
- domain;
- organisation;
- assignee;
- due/overdue;
- participant;
- provider;
- created date.

Never expose sensitive narratives in list rows.

## 17. Audit and evidence

Every Core mutation emits:

- `AdminWorkItemEvent` for operational timeline; and
- canonical `AuditEvent` for platform audit.

Audit metadata includes only the minimum needed:

- actor;
- action;
- target reference;
- organisation/participant reference where lawful;
- correlation ID;
- reason code;
- result.

Do not place complaint, incident or support narratives into generic audit metadata.

## 18. Notifications and escalation

The Core service may invoke existing notification services for:

- assignment;
- escalation;
- overdue SLA;
- decision completed;
- participant/provider follow-up.

Immediate safety handling stays with canonical incident/safeguarding services.

The admin queue is not an emergency-response system.

## 19. Accessibility requirements

Admin and participant-facing Core surfaces must meet WCAG 2.2 AA.

Release-blocking requirements:

- keyboard-complete operation;
- visible focus;
- screen-reader names/roles/states;
- no colour-only priority/status;
- 200% zoom/reflow;
- reduced-motion support;
- clear validation/recovery;
- plain-language status labels;
- large enough targets;
- no timeout for moderation/participant decisions unless external constraints require it;
- accessible human escalation path.

## 20. Operational safeguards

- Feature flag the new Core queue and moderation APIs off by default.
- Do not disable existing admin pages during migration.
- No destructive data migration in the first release.
- No cross-tenant admin queue leakage.
- No client-selected tenant authority.
- No direct Core writes to foreign domain aggregates.
- No AI autonomous moderation decisions.
- No participant/provider scoring for moderation priority.
- No production claim derived from feature-flag state alone.

## 21. Feature flags

Initial flags:

```env
MAPABLE_CORE_V1_API_ENABLED=false
MAPABLE_ADMIN_WORK_QUEUE_ENABLED=false
MAPABLE_CORE_MODERATION_ENABLED=false
MAPABLE_ADMIN_COMMAND_CENTRE_V2_ENABLED=false
```

## 22. Delivery slices

### Slice A — Read-only control plane

- Core request context
- v1 response envelope
- module/capability read APIs
- read-only admin queue projection
- no schema changes required

### Slice B — Durable admin work queue

- `AdminWorkItem`
- `AdminWorkItemEvent`
- assignment / transition actions
- audit integration
- support + incident adapters

### Slice C — Moderation orchestration

- Access moderation adapter
- moderation decisions
- reason codes
- domain-service action dispatch
- human review gates

### Slice D — Command centre migration

- one admin landing page
- consolidated filters
- overdue / assignment views
- capability health
- existing admin screens remain deep links

## 23. Definition of done

The Core centralisation is ready for controlled pilot when:

1. all v1 routes use one request-context resolver;
2. cross-tenant access tests pass;
3. participant authority is never inferred from organisation membership;
4. the admin queue contains references, not sensitive narrative copies;
5. incidents, support tickets and complaints remain distinct domain records;
6. moderation decisions call domain services rather than direct Prisma writes;
7. Access moderation can run through the Core queue without losing current functionality;
8. audit evidence exists for claim, transition, decision and escalation actions;
9. keyboard/screen-reader admin flows pass accessibility checks;
10. all new flags default false;
11. old routes/admin surfaces continue to work until explicitly retired;
12. rollback consists of disabling the new flags without deleting canonical records.

## 24. Explicit non-goals

This work does not:

- replace the canonical Prisma schema with microservices;
- create a second identity system;
- create a second consent or authority ledger;
- merge incidents, complaints and support tickets;
- replace Care, Transport, Access or Billing domain services;
- automate regulatory reporting;
- auto-ban providers or workers;
- create risk/worthiness scores;
- change production flags;
- merge or deploy.
