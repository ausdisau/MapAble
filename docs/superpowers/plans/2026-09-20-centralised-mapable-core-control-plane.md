# Centralised MapAble Core Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralise MapAble platform administration, API conventions and moderation orchestration while preserving each domain's existing source of truth and participant-control boundaries.

**Architecture:** Introduce a versioned `/api/v1` façade and a new `lib/platform/core/**` control-plane package. The Core control plane resolves identity/tenant/authority context, coordinates a durable admin work queue, reads capability/domain truth from ConvergenceOS, and dispatches actions back through existing domain services rather than directly mutating foreign aggregate tables.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma/PostgreSQL, existing NextAuth/mobile bearer auth, Zod, Vitest, Playwright + axe, Tailwind/Radix-compatible admin UI.

**Spec:** `docs/superpowers/specs/2026-09-20-centralised-mapable-core-control-plane.md`

## Global Constraints

- Canonical repo: `ausdisau/MapAble`.
- Base inspected: `main` @ `b51cb9b73395769c46c3f64dd6094120bc2cedac`.
- Keep `Organisation.id` as the tenancy source of truth.
- Keep `ConsentRecord`, `ParticipantAuthorityGrant`, `AuthorityDecision`, and `AuditEvent` as the canonical governance records.
- Keep incidents, support tickets, complaints/engagement, Access, Care, Transport, Billing and Provider Quality in their existing domain owners.
- The central admin queue stores references and workflow metadata only; never copy sensitive narratives, precise location, NDIS numbers, clinical notes or message bodies into queue rows.
- No Core control-plane service may directly mutate a foreign domain aggregate. It must call that domain's service.
- AI may classify or suggest priority only when clearly labelled as inferred; human review remains required for consequential moderation decisions.
- Existing routes and admin pages remain functional during migration.
- All new feature flags default false.
- WCAG 2.2 AA and keyboard/screen-reader completion are release gates.
- No merge, deployment, production flag enablement or destructive migration occurs in this plan.

## Review Focus

1. **Cross-tenant access:** a user with admin-like permissions for Organisation A must not see Organisation B work items or sensitive details.
2. **Participant authority confusion:** organisation membership or a support relationship must never become participant authority.
3. **Sensitive-data duplication:** queue synchronisation must not copy incident, complaint, support or location narratives into `AdminWorkItem`.
4. **Foreign-domain writes:** moderation actions must execute through existing domain services, never through Core-owned Prisma mutations to foreign aggregates.
5. **Partial migration:** disabling all new flags must leave existing admin/support/incident/access moderation paths usable without data loss.

---

### Task 1: Add v1 API Context and Response Contracts

**Files:**
- Create: `apps/web/lib/platform/core/api/request-context.ts`
- Create: `apps/web/lib/platform/core/api/response.ts`
- Create: `apps/web/lib/platform/core/api/index.ts`
- Test: `apps/web/tests/core-api-context.test.ts`
- Test: `apps/web/tests/core-api-response.test.ts`

**Interfaces:**
- Consumes: `requireApiSessionOrMobileBearer`, `getUserOrganisationIds`, `hasPermission`.
- Produces:
  - `resolveCoreApiContext(request, options) -> Promise<CoreApiContext | Response>`
  - `coreJsonOk(data, correlationId, status?)`
  - `coreJsonError(code, message, correlationId, status)`

- [ ] **Step 1: Write the failing context tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { resolveCoreApiContext } from "@/lib/platform/core/api/request-context";

describe("resolveCoreApiContext", () => {
  it("derives organisation scope server-side", async () => {
    const result = await resolveCoreApiContext(
      new Request("https://mapable.test/api/v1/core/me"),
      { permission: "admin:command-centre:read" },
    );

    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) return;
    expect(result.organisationIds).toEqual(["org-a"]);
    expect(result.correlationId).toMatch(/^core_/);
  });

  it("does not trust a client-selected organisation header", async () => {
    const request = new Request("https://mapable.test/api/v1/admin/work-items", {
      headers: { "x-mapable-organisation-id": "org-b" },
    });

    const result = await resolveCoreApiContext(request, {
      permission: "admin:command-centre:read",
    });

    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) return;
    expect(result.organisationIds).toEqual(["org-a"]);
    expect(result.activeOrganisationId).not.toBe("org-b");
  });
});
```

Mock only the existing auth/organisation boundary; do not mock the function under test.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
cd apps/web
pnpm vitest run tests/core-api-context.test.ts tests/core-api-response.test.ts
```

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement minimal contracts**

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

export type ResolveCoreApiContextOptions = {
  permission?: Permission;
  participantId?: string;
};
```

Rules:
- authentication reuses `requireApiSessionOrMobileBearer`;
- org scope comes from the server-side organisation service;
- no client header/query value grants tenancy;
- correlation ID is generated once per request;
- participant scope is left unset unless self/authority checks succeed.

- [ ] **Step 4: Implement the v1 response envelope**

Success:

```ts
return Response.json({
  data,
  meta: { correlationId },
}, { status });
```

Error:

```ts
return Response.json({
  error: { code, message },
  meta: { correlationId },
}, { status });
```

- [ ] **Step 5: Run targeted tests and type check**

```bash
pnpm vitest run tests/core-api-context.test.ts tests/core-api-response.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/platform/core/api tests/core-api-context.test.ts tests/core-api-response.test.ts
git commit -m "feat(core): add v1 API context contracts"
```

---

### Task 2: Add Narrow Core Admin Permissions and Feature Flags

**Files:**
- Modify: `apps/web/lib/auth/permissions.ts`
- Create: `apps/web/lib/config/core-control-plane.ts`
- Modify: `apps/web/.env.example`
- Test: `apps/web/tests/core-control-plane-permissions.test.ts`
- Test: `apps/web/tests/core-control-plane-config.test.ts`

**Interfaces:**
- Produces permissions:
  - `admin:work-items:read`
  - `admin:work-items:claim`
  - `admin:work-items:transition`
  - `admin:moderation:read`
  - `admin:moderation:decide`
  - `admin:moderation:escalate`
  - `admin:platform-registry:read`

- [ ] **Step 1: Write failing permission tests**

```ts
it("grants MapAble admins the new work-item scopes", () => {
  expect(hasPermission("mapable_admin", "admin:work-items:read")).toBe(true);
  expect(hasPermission("mapable_admin", "admin:moderation:decide")).toBe(true);
});

it("does not grant support coordinators moderation decision power", () => {
  expect(hasPermission("support_coordinator", "admin:moderation:decide")).toBe(false);
});
```

- [ ] **Step 2: Write failing config tests**

```ts
it("keeps every Core control-plane write flag off by default", () => {
  expect(coreControlPlaneConfig.workQueueEnabled).toBe(false);
  expect(coreControlPlaneConfig.moderationEnabled).toBe(false);
  expect(coreControlPlaneConfig.commandCentreV2Enabled).toBe(false);
});
```

- [ ] **Step 3: Run RED**

```bash
pnpm vitest run tests/core-control-plane-permissions.test.ts tests/core-control-plane-config.test.ts
```

- [ ] **Step 4: Add the permissions and config**

```ts
export const coreControlPlaneConfig = {
  v1ApiEnabled: process.env.MAPABLE_CORE_V1_API_ENABLED === "true",
  workQueueEnabled: process.env.MAPABLE_ADMIN_WORK_QUEUE_ENABLED === "true",
  moderationEnabled: process.env.MAPABLE_CORE_MODERATION_ENABLED === "true",
  commandCentreV2Enabled:
    process.env.MAPABLE_ADMIN_COMMAND_CENTRE_V2_ENABLED === "true",
} as const;
```

Append to `.env.example`:

```env
MAPABLE_CORE_V1_API_ENABLED=false
MAPABLE_ADMIN_WORK_QUEUE_ENABLED=false
MAPABLE_CORE_MODERATION_ENABLED=false
MAPABLE_ADMIN_COMMAND_CENTRE_V2_ENABLED=false
```

- [ ] **Step 5: Run GREEN**

```bash
pnpm vitest run tests/core-control-plane-permissions.test.ts tests/core-control-plane-config.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add lib/auth/permissions.ts lib/config/core-control-plane.ts .env.example tests/core-control-plane-*.test.ts
git commit -m "feat(core): add admin control-plane gates"
```

---

### Task 3: Add Durable Admin Work Queue Models

**Files:**
- Modify: `apps/web/prisma/schema.prisma`
- Create: `apps/web/prisma/migrations/<timestamp>_core_admin_work_queue/migration.sql`
- Create: `apps/web/lib/platform/core/admin/work-item-types.ts`
- Create: `apps/web/lib/platform/core/admin/work-item-service.ts`
- Test: `apps/web/tests/core-admin-work-item-service.test.ts`

**Interfaces:**
- Produces:
  - `upsertAdminWorkItem(input)`
  - `listAdminWorkItems(input)`
  - `claimAdminWorkItem(input)`
  - `transitionAdminWorkItem(input)`

- [ ] **Step 1: Write failing service tests**

Required cases:
- identical `dedupeKey` upserts one work item;
- Organisation A context cannot list Organisation B item;
- claim writes an operational event and canonical audit event;
- source metadata does not accept narrative fields.

```ts
it("deduplicates by source and reason", async () => {
  const first = await upsertAdminWorkItem(candidate);
  const second = await upsertAdminWorkItem(candidate);
  expect(second.id).toBe(first.id);
});

it("rejects sensitive queue payload fields", async () => {
  await expect(
    upsertAdminWorkItem({
      ...candidate,
      metadata: { incidentNarrative: "sensitive text" },
    }),
  ).rejects.toThrow("SENSITIVE_QUEUE_METADATA_FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-admin-work-item-service.test.ts
```

- [ ] **Step 3: Add Prisma enums/models**

Add exactly the enums/models defined in the spec:
- `AdminWorkItemKind`
- `AdminWorkItemStatus`
- `AdminWorkItemPriority`
- `AdminWorkItem`
- `AdminWorkItemEvent`

Do not add foreign-key cascades from domain tables into Core work items.

- [ ] **Step 4: Add migration**

Generate/add an additive migration only. Do not modify existing domain tables.

- [ ] **Step 5: Implement service guardrails**

`upsertAdminWorkItem` accepts:

```ts
export type AdminWorkCandidate = {
  dedupeKey: string;
  kind: AdminWorkItemKind;
  priority: AdminWorkItemPriority;
  sourceDomain: string;
  sourceEntityType: string;
  sourceEntityId: string;
  reasonCode: string;
  organisationId?: string;
  participantId?: string;
  dueAt?: Date;
  sourceUpdatedAt?: Date;
  correlationId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};
```

Allowlist metadata keys. Reject free-form narrative/value blobs.

- [ ] **Step 6: Emit audit through the canonical audit service**

Claim/transition actions call `createAuditEvent`. Do not create a second audit table.

- [ ] **Step 7: Run tests**

```bash
pnpm vitest run tests/core-admin-work-item-service.test.ts
pnpm type-check
```

- [ ] **Step 8: Commit**

```bash
git add prisma lib/platform/core/admin tests/core-admin-work-item-service.test.ts
git commit -m "feat(core): add durable admin work queue"
```

---

### Task 4: Define Domain Source Adapter Boundary

**Files:**
- Create: `apps/web/lib/platform/core/admin/source-adapter.ts`
- Create: `apps/web/lib/platform/core/admin/adapter-registry.ts`
- Create: `apps/web/lib/platform/core/admin/adapters/support.ts`
- Create: `apps/web/lib/platform/core/admin/adapters/incidents.ts`
- Test: `apps/web/tests/core-admin-source-adapters.test.ts`

**Interfaces:**

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

- [ ] **Step 1: Write failing adapter tests**

Support adapter:
- lists open/triage tickets;
- does not copy `description`;
- detail requires existing support access policy.

Incident adapter:
- lists unresolved/escalated incidents;
- queue candidate excludes narrative;
- detail uses incident access policy.

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-admin-source-adapters.test.ts
```

- [ ] **Step 3: Implement support adapter**

Read through `SupportTicket` and existing `lib/support/**` / safety policy. The adapter may call existing service methods for actions but must not update support tables directly.

- [ ] **Step 4: Implement incident adapter**

Read through `lib/incidents/**` and existing incident access policy.

- [ ] **Step 5: Add registry**

```ts
export const adminWorkSourceAdapters = new Map([
  ["support", supportAdminWorkAdapter],
  ["incidents", incidentAdminWorkAdapter],
]);
```

Fail closed for unknown source domains.

- [ ] **Step 6: Run GREEN**

```bash
pnpm vitest run tests/core-admin-source-adapters.test.ts tests/authority/authority-threats.test.ts
pnpm type-check
```

- [ ] **Step 7: Commit**

```bash
git add lib/platform/core/admin tests/core-admin-source-adapters.test.ts
git commit -m "feat(core): add admin source adapters"
```

---

### Task 5: Add Access Moderation and Engagement Adapters

**Files:**
- Create: `apps/web/lib/platform/core/admin/adapters/access-moderation.ts`
- Create: `apps/web/lib/platform/core/admin/adapters/engagement.ts`
- Modify: `apps/web/lib/platform/core/admin/adapter-registry.ts`
- Test: `apps/web/tests/core-moderation-adapters.test.ts`

**Interfaces:**
- Access adapter consumes current `AccessModerationQueue` / `decideModeration`.
- Engagement adapter consumes current complaint/engagement domain services.
- Neither adapter writes foreign tables via Core Prisma.

- [ ] **Step 1: Write failing Access moderation tests**

```ts
it("routes an approval through the Access moderation service", async () => {
  await accessModerationAdminAdapter.applyAction?.({
    sourceEntityType: "AccessModerationQueue",
    sourceEntityId: "queue-1",
    action: "approve",
    reasonCode: "verified_correction",
    context,
  });

  expect(decideModeration).toHaveBeenCalledWith(
    expect.objectContaining({
      queueId: "queue-1",
      moderatorId: context.user.id,
      status: "approved",
    }),
  );
});
```

Also assert the adapter does **not** import `prisma`.

- [ ] **Step 2: Write failing engagement tests**

Complaint candidates expose only:
- submission ID;
- status;
- priority/SLA;
- organisation/participant refs;
- reason/category code;
- timestamps.

No free-text complaint content appears in the candidate.

- [ ] **Step 3: Run RED**

```bash
pnpm vitest run tests/core-moderation-adapters.test.ts
```

- [ ] **Step 4: Implement adapters**

Map actions to existing domain service commands. Unknown moderation action -> fail closed.

- [ ] **Step 5: Register adapters and run GREEN**

```bash
pnpm vitest run tests/core-moderation-adapters.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add lib/platform/core/admin/adapters lib/platform/core/admin/adapter-registry.ts tests/core-moderation-adapters.test.ts
git commit -m "feat(core): integrate access and engagement moderation"
```

---

### Task 6: Add v1 Core, Admin and Moderation Routes

**Files:**
- Create: `apps/web/app/api/v1/core/me/route.ts`
- Create: `apps/web/app/api/v1/core/modules/route.ts`
- Create: `apps/web/app/api/v1/core/capabilities/route.ts`
- Create: `apps/web/app/api/v1/admin/overview/route.ts`
- Create: `apps/web/app/api/v1/admin/work-items/route.ts`
- Create: `apps/web/app/api/v1/admin/work-items/[id]/route.ts`
- Create: `apps/web/app/api/v1/admin/work-items/[id]/claim/route.ts`
- Create: `apps/web/app/api/v1/admin/work-items/[id]/transition/route.ts`
- Create: `apps/web/app/api/v1/moderation/cases/route.ts`
- Create: `apps/web/app/api/v1/moderation/cases/[id]/decision/route.ts`
- Test: `apps/web/tests/core-v1-api-routes.test.ts`

**Interfaces:**
- Consumes: Tasks 1–5 services.
- Registry routes consume existing `app/lib/modules.ts` and ConvergenceOS seed/catalogue functions.

- [ ] **Step 1: Write failing route tests**

Cover:
- 401 unauthenticated;
- 403 missing narrow scope;
- cross-tenant filtering;
- disabled feature flag returns explicit unavailable response;
- work-item list uses stable v1 envelope;
- moderation decision cannot run when moderation flag is false;
- moderation decision uses domain adapter action.

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-v1-api-routes.test.ts
```

- [ ] **Step 3: Implement read-only Core routes**

`/core/modules` and `/core/capabilities` must read existing registries. Do not persist a second registry.

- [ ] **Step 4: Implement Admin routes**

Require the specific Task 2 permissions, not generic `isAdminRole` shortcuts.

- [ ] **Step 5: Implement Moderation routes**

Actions:
- `approve`
- `reject`
- `needs_changes`
- `escalate`
- domain-specific actions only where adapter allowlists them.

- [ ] **Step 6: Run GREEN**

```bash
pnpm vitest run tests/core-v1-api-routes.test.ts tests/core-admin-work-item-service.test.ts tests/core-moderation-adapters.test.ts
pnpm type-check
```

- [ ] **Step 7: Commit**

```bash
git add app/api/v1 tests/core-v1-api-routes.test.ts
git commit -m "feat(core): add versioned control-plane APIs"
```

---

### Task 7: Build the Central Admin Command Centre v2

**Files:**
- Create: `apps/web/components/admin/core/AdminCommandCentreV2.tsx`
- Create: `apps/web/components/admin/core/AdminWorkQueueTable.tsx`
- Create: `apps/web/components/admin/core/AdminWorkFilters.tsx`
- Create: `apps/web/components/admin/core/PlatformCapabilityPanel.tsx`
- Modify: `apps/web/app/admin/page.tsx`
- Test: `apps/web/tests/core-admin-command-centre.test.tsx`
- Test: `apps/web/tests/a11y/core-admin-command-centre.spec.ts`

**Interfaces:**
- Consumes: `/api/v1/admin/overview`, `/api/v1/admin/work-items`, `/api/v1/core/capabilities`.

- [ ] **Step 1: Write failing component tests**

Assert:
- one H1;
- queue list never renders free-text incident/complaint narratives;
- every priority has visible text;
- filter controls are labelled;
- human-readable domain/source labels;
- moderation decisions are not exposed to users lacking `admin:moderation:decide`.

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-admin-command-centre.test.tsx
```

- [ ] **Step 3: Implement V2 UI behind feature flag**

When `MAPABLE_ADMIN_COMMAND_CENTRE_V2_ENABLED=false`, render the existing `AdminDashboard`.

When true, render:
- Needs attention
- Moderation
- Incidents & safeguarding
- Complaints & support
- Provider / credential reviews
- Billing exceptions
- Data quality
- Platform capability status
- Audit/high-impact actions

Existing admin deep links remain available.

- [ ] **Step 4: Add accessible filtering**

Filters:
- priority;
- status;
- domain;
- organisation;
- assignee;
- due/overdue;
- created date.

No colour-only state.

- [ ] **Step 5: Add Playwright/axe coverage**

Test keyboard traversal, focus order, 200% zoom/reflow, and no serious/critical axe violations.

- [ ] **Step 6: Run GREEN**

```bash
pnpm vitest run tests/core-admin-command-centre.test.tsx
pnpm playwright test tests/a11y/core-admin-command-centre.spec.ts
pnpm type-check
pnpm lint:components
```

- [ ] **Step 7: Commit**

```bash
git add components/admin/core app/admin/page.tsx tests/core-admin-command-centre.test.tsx tests/a11y/core-admin-command-centre.spec.ts
git commit -m "feat(core): centralise admin command centre"
```

---

### Task 8: Add Queue Synchronisation and Domain Event Hooks

**Files:**
- Create: `apps/web/lib/platform/core/admin/work-item-sync-service.ts`
- Modify narrowly:
  - `apps/web/lib/support/ticket-service.ts`
  - `apps/web/lib/incidents/incident-service.ts`
  - appropriate Access moderation creation service
  - appropriate engagement complaint creation service
- Test: `apps/web/tests/core-admin-work-item-sync.test.ts`

**Interfaces:**
- Produces `syncAdminWorkItemFromDomainEvent(input)`.
- Domain services call the Core synchroniser **after** their canonical write.
- Synchroniser is no-op when the work-queue feature flag is false.

- [ ] **Step 1: Write failing hook tests**

For each initial source:
- canonical domain write succeeds;
- queue sync creates/upserts reference only;
- queue sync failure does not roll back or corrupt the canonical domain record;
- feature disabled -> zero Core work-item writes.

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-admin-work-item-sync.test.ts
```

- [ ] **Step 3: Implement synchroniser**

```ts
export async function syncAdminWorkItemFromDomainEvent(
  input: DomainAdminWorkEvent,
): Promise<void> {
  if (!coreControlPlaneConfig.workQueueEnabled) return;
  // validate source, derive reason/priority, upsert reference-only work item
}
```

Do not accept arbitrary metadata from caller.

- [ ] **Step 4: Add minimal hooks to domain services**

Hook only after current domain service validation and canonical persistence. Do not insert Core Prisma calls directly into route handlers.

- [ ] **Step 5: Run GREEN**

```bash
pnpm vitest run tests/core-admin-work-item-sync.test.ts tests/core-admin-source-adapters.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add lib/platform/core/admin/work-item-sync-service.ts lib/support lib/incidents lib/access tests/core-admin-work-item-sync.test.ts
git commit -m "feat(core): sync domain work into central admin queue"
```

---

### Task 9: Harden Privacy, Audit and Tenant Isolation

**Files:**
- Create: `apps/web/tests/core-control-plane-privacy.test.ts`
- Create: `apps/web/tests/core-control-plane-tenancy.test.ts`
- Create: `apps/web/tests/core-control-plane-audit.test.ts`
- Modify only the Core services required by failing tests.

**Interfaces:**
- Validates complete Core control-plane boundary.

- [ ] **Step 1: Write RED tests for sensitive-data leakage**

Test that list/overview payloads never contain fields named:
- `description`
- `narrative`
- `notes`
- `preciseLocation`
- `ndisNumber`
- `messageBody`
- `clinical*`

when those originate from a foreign domain record.

- [ ] **Step 2: Write RED tenant-isolation tests**

Create two organisations and verify:
- Org A scoped user cannot list Org B work;
- a forged source entity ID cannot bypass adapter policy;
- generic admin queue access does not imply participant authority.

- [ ] **Step 3: Write RED audit tests**

Claim, transition, decision and escalation each emit:
- operational event;
- canonical audit event;
- correlation ID;
- reason code.

Audit metadata must not contain narrative content.

- [ ] **Step 4: Run RED**

```bash
pnpm vitest run tests/core-control-plane-privacy.test.ts tests/core-control-plane-tenancy.test.ts tests/core-control-plane-audit.test.ts
```

- [ ] **Step 5: Fix only the demonstrated gaps**

No unrelated refactors.

- [ ] **Step 6: Run GREEN**

```bash
pnpm vitest run tests/core-control-plane-privacy.test.ts tests/core-control-plane-tenancy.test.ts tests/core-control-plane-audit.test.ts
pnpm type-check
```

- [ ] **Step 7: Commit**

```bash
git add lib/platform/core tests/core-control-plane-*.test.ts
git commit -m "security(core): harden admin control-plane boundaries"
```

---

### Task 10: Backfill Existing Open Work and Preserve Rollback

**Files:**
- Create: `apps/web/scripts/backfill-core-admin-work-items.ts`
- Create: `apps/web/tests/core-admin-work-item-backfill.test.ts`
- Create: `apps/web/docs/core-control-plane-rollout.md`

**Interfaces:**
- Backfill reads existing domain queues and upserts Core references.
- It never changes the source domain's status.

- [ ] **Step 1: Write failing deterministic backfill tests**

Verify:
- same source rows produce same `dedupeKey`;
- repeated run does not duplicate work items;
- closed/resolved source rows are skipped unless explicitly requested;
- no source row is updated;
- sensitive narratives are not copied.

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/core-admin-work-item-backfill.test.ts
```

- [ ] **Step 3: Implement the backfill script**

CLI contract:

```bash
pnpm tsx scripts/backfill-core-admin-work-items.ts --dry-run
pnpm tsx scripts/backfill-core-admin-work-items.ts --apply
```

Default is dry-run when no mode is given.

- [ ] **Step 4: Write rollout/rollback doc**

Document:
- flags;
- dry-run;
- apply;
- validation counts;
- disable flags to roll back;
- existing routes remain canonical fallback;
- never delete source queue/domain records during rollback.

- [ ] **Step 5: Run GREEN**

```bash
pnpm vitest run tests/core-admin-work-item-backfill.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add scripts/backfill-core-admin-work-items.ts tests/core-admin-work-item-backfill.test.ts docs/core-control-plane-rollout.md
git commit -m "ops(core): add admin queue backfill and rollback"
```

---

### Task 11: Full Verification and Pilot Evidence

**Files:**
- Create: `apps/web/docs/core-control-plane-pilot-evidence.md`
- Review all changed files.

- [ ] **Step 1: Run targeted suites**

```bash
cd apps/web
pnpm vitest run   tests/core-api-context.test.ts   tests/core-api-response.test.ts   tests/core-control-plane-permissions.test.ts   tests/core-control-plane-config.test.ts   tests/core-admin-work-item-service.test.ts   tests/core-admin-source-adapters.test.ts   tests/core-moderation-adapters.test.ts   tests/core-v1-api-routes.test.ts   tests/core-admin-command-centre.test.tsx   tests/core-admin-work-item-sync.test.ts   tests/core-control-plane-privacy.test.ts   tests/core-control-plane-tenancy.test.ts   tests/core-control-plane-audit.test.ts   tests/core-admin-work-item-backfill.test.ts
```

- [ ] **Step 2: Run current regression suites that protect affected domains**

```bash
pnpm vitest run   tests/authority/authority-grants.test.ts   tests/authority/authority-threats.test.ts
pnpm type-check
pnpm lint
```

Also run existing support, incident, engagement and Access moderation suites discovered during implementation.

- [ ] **Step 3: Run accessibility E2E**

```bash
pnpm playwright test tests/a11y/core-admin-command-centre.spec.ts
```

- [ ] **Step 4: Verify migration safety**

Use a disposable test database:
- apply migrations;
- run backfill dry-run;
- run apply;
- run apply again;
- verify idempotent counts;
- verify source-domain rows unchanged.

- [ ] **Step 5: Create pilot evidence**

Record:
- tested commit SHA;
- flags and defaults;
- migration/backfill output;
- test results;
- accessibility results;
- tenant-isolation evidence;
- sample redacted audit event;
- known limitations;
- rollback procedure.

- [ ] **Step 6: Whole-branch review**

Use Superpowers requesting-code-review against the complete branch. Do not merge or enable production flags.

## Rollout Order

1. Deploy schema + code with all new flags false.
2. Enable `MAPABLE_CORE_V1_API_ENABLED` for internal admins only.
3. Enable read-only queue projection/backfill in a controlled environment.
4. Compare Core queue with existing Access/support/incident/engagement queues.
5. Enable work-item assignment/transition.
6. Enable Core moderation for one domain, starting with Access moderation.
7. Enable Admin Command Centre v2.
8. Expand to other moderation/work queues only after parity and accessibility evidence.

## Rollback

Rollback is flag-first:

```env
MAPABLE_ADMIN_COMMAND_CENTRE_V2_ENABLED=false
MAPABLE_CORE_MODERATION_ENABLED=false
MAPABLE_ADMIN_WORK_QUEUE_ENABLED=false
MAPABLE_CORE_V1_API_ENABLED=false
```

Existing admin/domain routes remain usable. Do not delete `AdminWorkItem` history merely because the new UI is disabled. Canonical domain records remain authoritative throughout.
