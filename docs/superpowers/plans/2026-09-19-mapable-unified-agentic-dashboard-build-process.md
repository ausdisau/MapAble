# MapAble Unified Agentic Dashboard Build Process Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the participant-controlled MapAble Unified Agentic Dashboard across web and mobile, prove the bounded “Help Me Go Somewhere” Care + Transport slice, and add Temporal only as an optional durable coordinator after the non-Temporal path passes safety, accessibility, authority and replay gates.

**Architecture:** Reuse MapAble Core as the authority and evidence spine. Compose a participant-centred dashboard read model from existing canonical models and domain services, use `CareOSMission` as the parent journey record, preserve `CareShift` and `TransportTrip` as domain sources of truth, and keep every consequential action behind deterministic authority checks. Web establishes visual truth; Expo/React Native consumes the same contracts; Temporal is default-off and cannot grant authority.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, Prisma/PostgreSQL, Vitest, Playwright + axe, Expo 57, React Native 0.86, React Navigation 7, optional Temporal TypeScript SDK behind `TEMPORAL_ENABLED`.

**Spec:** `docs/superpowers/specs/2026-09-19-mapable-unified-agentic-dashboard-design.md`

## Global Constraints

- Canonical repository: `ausdisau/MapAble`.
- Web surface: `apps/web`; mobile surface: `apps/mobile`.
- Keep `ParticipantAuthorityGrant`, `AuthorityDecision`, `ConsentRecord` and the canonical audit service as the authority/evidence source of truth.
- Reuse `CareOSMission` for the parent agentic journey; do not create a second journey identity table for this slice.
- Reuse `CareShift` and `TransportTrip` for service execution; do not auto-assign a worker or silently substitute an unverified transport provider.
- Temporal remains behind `TEMPORAL_ENABLED` and the non-Temporal path must remain functional.
- A model may propose or prepare; deterministic services decide whether an action is authorised.
- Revocation blocks new actions immediately; historical audit evidence remains immutable.
- No autonomous payment release, clinical treatment decision, restrictive-practice decision, capacity assessment, emergency-service replacement, emotion recognition, or continuous household surveillance.
- Web accessibility baseline: WCAG 2.2 AA with keyboard-complete operation, visible focus, zoom/reflow, reduced motion, no colour-only meaning and screen-reader semantics.
- Mobile accessibility baseline: Dynamic Type, VoiceOver/TalkBack, switch-control-compatible targets, reduced-motion support and AAC-friendly concise actions.
- The Unified Accessible Dashboard skin is the visual source of truth, but the functional hierarchy and authority semantics in the approved spec override decorative choices.
- Visual Truth must remain development-only and must not ship in a production bundle.

## Review Focus

1. **Mandate revoked after approval but before side effect** — the execution service must re-evaluate authority and refuse the action; covered in Task 6 and Task 8 tests.
2. **Only Care or Transport is confirmed** — the composite journey must remain `partially_confirmed` rather than presenting a false “confirmed” state; covered in Task 1 tests.
3. **Mobile reconnects with stale cached confirmation** — the UI must label stale state and re-fetch before any consequential action; covered in Task 7 tests.
4. **Access evidence is missing or stale** — the dashboard must say “unverified/manual review” and never silently treat it as verified; covered in Task 2 and Task 3 tests.
5. **Participant uses AAC, switch access or takes longer to respond** — no authority inference or forced timeout is permitted; covered in Task 3 and Task 10 accessibility tests.

---

## Build Process and Merge Order

The work is one product slice but four reviewable trains:

1. **Core contracts + participant read model**
2. **Web + My Agency + Care/Transport journey**
3. **Mobile parity**
4. **Durability + Temporal + recovery hardening**

Do not start a later train while an earlier train has an unresolved authority, accessibility, data-model or audit defect. Each task below ends in a separate commit and reviewer gate.

### Task 1: Define Shared Dashboard and Journey Contracts

**Files:**
- Create: `apps/web/lib/agentic-dashboard/contracts.ts`
- Create: `apps/web/lib/agentic-dashboard/composite-state.ts`
- Test: `apps/web/tests/agentic-dashboard-contracts.test.ts`

**Interfaces:**
- Consumes: existing domain state strings from Care and Transport services.
- Produces: `AuthorityLevel`, `EvidenceState`, `JourneyState`, `ParticipantDashboardView`, `JourneySummary`, and `computeJourneyState(input)`.

- [ ] **Step 1: Write the failing contract/state tests**

```ts
import { describe, expect, it } from "vitest";
import { computeJourneyState } from "@/lib/agentic-dashboard/composite-state";

describe("computeJourneyState", () => {
  it("keeps a journey partially confirmed when transport is accepted but care is not", () => {
    expect(
      computeJourneyState({
        participantApproved: true,
        mandateActive: true,
        careStatus: "awaiting_provider",
        transportStatus: "accepted",
        disrupted: false,
        completed: false,
      }),
    ).toBe("partially_confirmed");
  });

  it("requires an active mandate before requesting services", () => {
    expect(
      computeJourneyState({
        participantApproved: true,
        mandateActive: false,
        careStatus: "ready",
        transportStatus: "ready",
        disrupted: false,
        completed: false,
      }),
    ).toBe("awaiting_mandate");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
cd apps/web
pnpm vitest run tests/agentic-dashboard-contracts.test.ts
```

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement the exact public contracts**

```ts
export type AuthorityLevel = "inform" | "recommend" | "prepare" | "act";

export type EvidenceState =
  | "verified"
  | "participant_confirmed"
  | "provider_reported"
  | "unverified"
  | "stale"
  | "manual_review_required";

export type JourneyState =
  | "draft"
  | "needs_requirements"
  | "options_ready"
  | "awaiting_participant_choice"
  | "awaiting_mandate"
  | "requesting_services"
  | "partially_confirmed"
  | "confirmed"
  | "in_progress"
  | "disrupted"
  | "recovering"
  | "completed"
  | "evidence_ready"
  | "cancelled_by_participant"
  | "cancelled_by_provider"
  | "failed_safe"
  | "expired";

export type JourneySummary = {
  id: string;
  title: string;
  state: JourneyState;
  careStatus: string | null;
  transportStatus: string | null;
  evidenceState: EvidenceState;
  startsAt: string | null;
  unresolvedDecision: string | null;
};

export type ParticipantDashboardView = {
  participantId: string;
  displayName: string;
  communicationSummary: string[];
  accessSummary: string[];
  authority: {
    activeGrantCount: number;
    expiringGrantCount: number;
    canActAutomatically: boolean;
  };
  journeys: JourneySummary[];
  generatedAt: string;
};
```

Implement `computeJourneyState` as a pure reducer. It must return `awaiting_mandate` before any service-request state if approval exists but the mandate is inactive, and must return `partially_confirmed` when exactly one service domain is confirmed.

- [ ] **Step 4: Run the tests and type check**

```bash
pnpm vitest run tests/agentic-dashboard-contracts.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agentic-dashboard tests/agentic-dashboard-contracts.test.ts
git commit -m "feat: define agentic dashboard contracts"
```

### Task 2: Build the Participant-Centred Dashboard Read Model

**Files:**
- Create: `apps/web/lib/agentic-dashboard/participant-dashboard-read-model.ts`
- Create: `apps/web/app/api/v1/participant-dashboard/route.ts`
- Test: `apps/web/tests/agentic-dashboard-read-model.test.ts`

**Interfaces:**
- Consumes: `ParticipantProfile`, accessibility/communication data, active `ParticipantAuthorityGrant` rows, consent data, `CareShift`, `TransportTrip` and canonical CareOS mission data.
- Produces: `getParticipantDashboardView({ participantId, actorUserId, now }) -> Promise<ParticipantDashboardView>` and authenticated GET `/api/v1/participant-dashboard`.

- [ ] **Step 1: Write a failing read-model test with mocked Prisma/services**

The test must prove:
- another user without authority cannot obtain the participant read model;
- expired grants are not counted as active;
- unverified access evidence is returned as `unverified`, not “verified”;
- a Care + Transport pair with only one confirmed domain remains `partially_confirmed`.

```ts
it("denies a non-participant without a current grant", async () => {
  await expect(
    getParticipantDashboardView({
      participantId: "participant-1",
      actorUserId: "delegate-1",
      now: new Date("2026-09-19T00:00:00Z"),
    }),
  ).rejects.toThrow("PARTICIPANT_AUTHORITY_REQUIRED");
});
```

- [ ] **Step 2: Run the targeted test**

```bash
pnpm vitest run tests/agentic-dashboard-read-model.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the read-model service**

Use existing canonical models only. The service may read multiple domain tables, but it must return one typed projection and must not expose raw health, funding or identity fields that the dashboard does not need.

Public signature:

```ts
export async function getParticipantDashboardView(input: {
  participantId: string;
  actorUserId: string;
  now?: Date;
}): Promise<ParticipantDashboardView>
```

Rules:
- self-read is permitted;
- delegated read requires `hasParticipantAuthority` for the dashboard read action and relevant consent scopes;
- use the current time once per request;
- select only display fields required by `ParticipantDashboardView`;
- sort current/upcoming events before historical ones;
- cap each source collection so the dashboard route cannot become an unbounded data export.

- [ ] **Step 4: Add the authenticated API route**

Mirror the current mobile-compatible authentication pattern used by `apps/web/app/api/accessibility-profile/route.ts`. Derive participant identity from the authenticated principal unless a valid scoped delegate context is already established server-side. Do not accept an arbitrary participant ID from an unauthorised request body/query parameter.

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run tests/agentic-dashboard-read-model.test.ts tests/authority/authority-grants.test.ts tests/authority/authority-threats.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agentic-dashboard app/api/v1/participant-dashboard tests/agentic-dashboard-read-model.test.ts
git commit -m "feat: add participant dashboard read model"
```

### Task 3: Replace the Dashboard Home with the Unified Participant Command Centre

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/components/layout/DashboardNav.tsx`
- Create: `apps/web/components/dashboard/agentic/UnifiedParticipantDashboard.tsx`
- Create: `apps/web/components/dashboard/agentic/MyDayTimeline.tsx`
- Create: `apps/web/components/dashboard/agentic/AgencyStatusCard.tsx`
- Create: `apps/web/components/dashboard/agentic/JourneyCard.tsx`
- Create: `apps/web/components/dashboard/agentic/EvidenceStateBadge.tsx`
- Create: `apps/web/components/dashboard/agentic/HumanHelpAction.tsx`
- Test: `apps/web/tests/agentic-dashboard-web.test.tsx`
- Test: `apps/web/tests/a11y/agentic-dashboard.spec.ts`

**Interfaces:**
- Consumes: `ParticipantDashboardView`.
- Produces: accessible participant command-centre UI and updated participant navigation.

- [ ] **Step 1: Write failing component tests**

Assert that the page:
- exposes one level-one heading;
- renders My Day before secondary cards in DOM order;
- renders “Unverified” as text when evidence is unverified;
- exposes a keyboard-focusable “Get human help” action;
- never renders “confirmed” for a `partially_confirmed` journey.

```tsx
expect(screen.getByRole("heading", { level: 1, name: /my day/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /get human help/i })).toBeInTheDocument();
expect(screen.getByText("Unverified")).toBeInTheDocument();
```

- [ ] **Step 2: Run the failing tests**

```bash
pnpm vitest run tests/agentic-dashboard-web.test.tsx
```

- [ ] **Step 3: Implement the semantic shell before visual styling**

Use existing MapAble app-shell components. Update participant navigation to the approved hierarchy: Home, My Day, Support, Transport, Access, Documents, Money & Agreements, Messages, My Agency, Help. Preserve role-specific admin links and do not change role or participant authority when a nav item is selected.

- [ ] **Step 4: Apply the Unified Accessible Dashboard visual source**

In Work/Codex, open the approved MapAble Unified Accessible Dashboard visual reference. Use Visual Truth only in local development to refine spacing, hierarchy, responsive widths and token values. Durable styling changes belong in normal source files; Visual Truth must not appear in production imports.

Validate:
- Desktop 1440×900;
- iPad 1024×1366;
- Phone 440×956;
- 200% zoom/reflow;
- reduced motion.

- [ ] **Step 5: Add the accessibility regression**

The Playwright/axe test must tab through the primary navigation and command-centre actions, assert no serious/critical axe violations, and confirm that evidence state is not represented by colour alone.

- [ ] **Step 6: Run the web gate**

```bash
pnpm vitest run tests/agentic-dashboard-web.test.tsx
pnpm playwright test tests/a11y/agentic-dashboard.spec.ts
pnpm type-check
pnpm lint:components
```

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/page.tsx components/layout/DashboardNav.tsx components/dashboard/agentic tests/agentic-dashboard-web.test.tsx tests/a11y/agentic-dashboard.spec.ts
git commit -m "feat: add unified participant dashboard"
```

### Task 4: Add the Participant-Facing My Agency Surface

**Files:**
- Create: `apps/web/app/dashboard/agency/page.tsx`
- Create: `apps/web/components/dashboard/agentic/AgencyGrantList.tsx`
- Create: `apps/web/app/api/participant-authority/grants/route.ts`
- Create: `apps/web/app/api/participant-authority/grants/[grantId]/route.ts`
- Test: `apps/web/tests/agentic-dashboard-agency.test.tsx`
- Modify only if required: `apps/web/lib/authority/participant-authority-service.ts`

**Interfaces:**
- Consumes: `listParticipantAuthorityGrants`, `revokeParticipantAuthority`, `listAuthorityDecisionsForParticipant`.
- Produces: participant-readable grant list, expiry/purpose/actions display and revocation endpoint.

- [ ] **Step 1: Write failing authority UI/API tests**

Tests must prove:
- the participant can see active, expired and revoked grants with explicit state;
- a grant exposes domain, purpose, actions, recipient and expiry;
- revoking a grant owned by another participant fails;
- a supporter relationship without a `ParticipantAuthorityGrant` never appears as executable authority.

- [ ] **Step 2: Run the tests**

```bash
pnpm vitest run tests/agentic-dashboard-agency.test.tsx tests/authority/authority-grants.test.ts
```

- [ ] **Step 3: Implement read/revoke routes**

GET returns only grants for the authenticated participant or validly scoped delegate. DELETE on `[grantId]` calls the existing revocation service and returns a plain-language result. Do not implement bulk revocation in this slice.

- [ ] **Step 4: Implement the My Agency page**

Use the four user-facing levels:
- Inform
- Recommend
- Prepare
- Act within mandate

Show “AI cannot grant itself permission” in the explanatory copy. Use direct participant language and expose an immediate revoke action.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/agentic-dashboard-agency.test.tsx tests/authority/authority-grants.test.ts tests/authority/authority-threats.test.ts
pnpm type-check
git add app/dashboard/agency app/api/participant-authority/grants components/dashboard/agentic/AgencyGrantList.tsx tests/agentic-dashboard-agency.test.tsx lib/authority/participant-authority-service.ts
git commit -m "feat: add participant agency controls"
```

### Task 5: Implement the Help Me Go Somewhere State Machine on the Canonical CareOS Mission Spine

**Files:**
- Create: `apps/web/lib/agentic-journey/help-me-go-somewhere-state.ts`
- Create: `apps/web/lib/agentic-journey/help-me-go-somewhere-service.ts`
- Create: `apps/web/app/api/agentic-journeys/route.ts`
- Create: `apps/web/app/api/agentic-journeys/[missionId]/route.ts`
- Test: `apps/web/tests/help-me-go-somewhere-state.test.ts`
- Test: `apps/web/tests/help-me-go-somewhere-service.test.ts`

**Interfaces:**
- Consumes: `createCanonicalMission`, `appendMissionEvent`, participant dashboard contracts and existing authority services.
- Produces: `createHelpMeGoSomewhereMission`, `getHelpMeGoSomewhereMission`, `applyJourneyEvent`.

- [ ] **Step 1: Write the transition-table tests**

Cover every legal state transition and at least these illegal transitions:
- `draft -> confirmed` without requirements/options/choice;
- `awaiting_mandate -> requesting_services` with inactive mandate;
- any terminal state -> `in_progress`;
- `disrupted -> confirmed` without an explicit recovery event.

- [ ] **Step 2: Run the failing tests**

```bash
pnpm vitest run tests/help-me-go-somewhere-state.test.ts tests/help-me-go-somewhere-service.test.ts
```

- [ ] **Step 3: Implement a pure transition function**

```ts
export function applyJourneyEvent(
  state: JourneyState,
  event: JourneyEvent,
): JourneyState
```

Persist the parent journey through `CareOSMission` and append idempotent mission events using `eventKey`. Store only relationship identifiers and the minimum journey snapshot needed for replay in the mission graph JSON; do not copy full care/transport records into the mission.

- [ ] **Step 4: Add create/read API routes**

Create accepts the destination, time window, access requirements summary, transport requirements and optional existing care request/shift ID. It must not book care or transport. It creates a `proposed` mission and returns `needs_requirements` or `options_ready` according to validated input completeness.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/help-me-go-somewhere-state.test.ts tests/help-me-go-somewhere-service.test.ts
pnpm type-check
git add lib/agentic-journey app/api/agentic-journeys tests/help-me-go-somewhere-*.test.ts
git commit -m "feat: add help me go somewhere mission state"
```

### Task 6: Execute the Bounded Care + Transport Slice Only After Participant Authority Is Revalidated

**Files:**
- Create: `apps/web/lib/agentic-journey/help-me-go-somewhere-execution.ts`
- Create: `apps/web/app/api/agentic-journeys/[missionId]/confirm/route.ts`
- Create: `apps/web/app/api/agentic-journeys/[missionId]/cancel/route.ts`
- Test: `apps/web/tests/help-me-go-somewhere-execution.test.ts`
- Reuse: `apps/web/lib/care/care-shift-service.ts`
- Reuse: `apps/web/lib/transport/transport-trip-service.ts`
- Reuse: `apps/web/lib/authority/authority-decision-service.ts`

**Interfaces:**
- Consumes: active journey mission, existing care request/shift context, transport trip creation, `evaluateAuthorityDecision`.
- Produces: `confirmHelpMeGoSomewhereMission` and `cancelHelpMeGoSomewhereMission`.

- [ ] **Step 1: Write failing authority-before-side-effect tests**

Use spies to prove `createTransportTrip` and any Care write are never called when authority is denied or revoked.

```ts
expect(createTransportTrip).not.toHaveBeenCalled();
expect(createCareShiftFromRequest).not.toHaveBeenCalled();
```

Also test revocation between “participantApproved” and execution: the second authority evaluation must deny the side effect.

- [ ] **Step 2: Run the failing test**

```bash
pnpm vitest run tests/help-me-go-somewhere-execution.test.ts
```

- [ ] **Step 3: Implement confirm execution**

The smallest safe slice starts from an existing support appointment/request where possible. Confirm execution:
1. loads the current mission;
2. re-checks participant/actor authority;
3. checks current consent scopes;
4. records an `AuthorityDecision`;
5. creates or links the transport request/trip using the canonical Transport service;
6. links the existing care request/shift identifier rather than building a care marketplace;
7. appends mission events;
8. writes audit evidence;
9. returns a composite state.

Do not auto-assign a replacement worker or transport provider.

- [ ] **Step 4: Implement participant cancellation**

Cancellation stops new actions, attempts safe cancellation of still-pending domain work, preserves completed audit history and returns any commitments that could not be reversed.

- [ ] **Step 5: Run regression tests**

```bash
pnpm vitest run tests/help-me-go-somewhere-execution.test.ts tests/transport-scheduling-routing.test.ts tests/authority/authority-grants.test.ts tests/authority/authority-threats.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add lib/agentic-journey app/api/agentic-journeys tests/help-me-go-somewhere-execution.test.ts
git commit -m "feat: execute bounded care transport journeys"
```

### Task 7: Add Native My Day and Agency Parity in Expo/React Native

**Files:**
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/src/navigation/AppNavigator.tsx`
- Create: `apps/mobile/src/runtime/participantDashboardApi.ts`
- Create: `apps/mobile/src/screens/MyDayScreen.tsx`
- Create: `apps/mobile/src/screens/SupportScreen.tsx`
- Create: `apps/mobile/src/screens/TransportScreen.tsx`
- Create: `apps/mobile/src/screens/AccessScreen.tsx`
- Create: `apps/mobile/src/screens/MoreScreen.tsx`
- Create: `apps/mobile/src/components/MyDayTimeline.tsx`
- Create: `apps/mobile/src/components/AgencyStatusCard.tsx`
- Create: `apps/mobile/src/components/JourneyCard.tsx`
- Create: `apps/mobile/src/runtime/participantDashboardApi.test.ts`
- Create: `apps/mobile/vitest.config.ts`

**Interfaces:**
- Consumes: GET `/api/v1/participant-dashboard` and the shared JSON contract.
- Produces: native My Day, Support, Transport, Access and More surfaces.

- [ ] **Step 1: Add pure-runtime test tooling and write a failing parser test**

Add `vitest` to mobile devDependencies and a `test` script. The first test rejects malformed dashboard payloads and preserves `stale` evidence state.

```ts
expect(() => parseParticipantDashboard({ journeys: "wrong" })).toThrow(
  "Invalid participant dashboard response",
);
```

- [ ] **Step 2: Run the test**

```bash
cd apps/mobile
pnpm test -- participantDashboardApi.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the API parser/client**

Follow the existing `mapableApi.ts` approach: validate unknown JSON before returning typed data. Do not request live device location. When the network fails and a cached read-only snapshot is shown, expose `isStale: true` and disable consequential actions until revalidation succeeds.

- [ ] **Step 4: Split the current monolithic App shell**

`App.tsx` becomes provider/bootstrap only. Move navigation to `src/navigation/AppNavigator.tsx`. Preserve the existing independence/home prototype screens only if they remain reachable under a clearly named secondary surface; do not mix smart-home permissions with participant service authority.

- [ ] **Step 5: Implement native screens**

Bottom tabs:
- My Day
- Support
- Transport
- Access
- More

More contains My Agency, Documents, Money & Agreements, Messages, Profile and Help entry points.

Use `FlatList` for unbounded timelines, minimum 48px interactive targets, native accessibility labels/roles, Dynamic Type-compatible text and reduced-motion-aware transitions.

- [ ] **Step 6: Verify stale-state behavior**

Simulate offline response:
- cached journey may be read;
- banner says “Showing saved information — reconnect to confirm current status”;
- Confirm/Cancel/Approve actions are disabled until fresh state is loaded.

- [ ] **Step 7: Run mobile gate and commit**

```bash
pnpm test -- participantDashboardApi.test.ts
pnpm typecheck
pnpm build:web
git add App.tsx package.json vitest.config.ts src
git commit -m "feat: add native participant dashboard"
```

### Task 8: Add the Default-Off Local Durable Workflow Mirror

**Files:**
- Modify: `apps/web/lib/workflows/temporal/workflow-types.ts`
- Modify: `apps/web/lib/platform/durable-workflow-service.ts`
- Create: `apps/web/lib/agentic-journey/local-journey-runner.ts`
- Test: `apps/web/tests/help-me-go-somewhere-local-workflow.test.ts`

**Interfaces:**
- Consumes: `WorkflowRun` and Help Me Go Somewhere execution service.
- Produces: local durable coordinator used whenever `TEMPORAL_ENABLED !== "true"`.

- [ ] **Step 1: Write the fallback tests**

Tests must prove:
- the new workflow key is recognised;
- a paused participant-confirmation workflow is not claimed as runnable;
- retry backoff does not execute an action after mandate revocation;
- cancellation produces a terminal workflow state.

- [ ] **Step 2: Run the failing test**

```bash
pnpm vitest run tests/help-me-go-somewhere-local-workflow.test.ts
```

- [ ] **Step 3: Add `helpMeGoSomewhereWorkflow` to the workflow registry**

Keep the existing keys unchanged and append the new key. The local runner advances only one durable step per claim so retries remain observable and idempotent.

- [ ] **Step 4: Re-check authority at every side-effect step**

The local runner must call the same execution service used by the API; it must not bypass `evaluateAuthorityDecision`.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/help-me-go-somewhere-local-workflow.test.ts tests/careos-production-foundation.test.ts
pnpm type-check
git add lib/workflows/temporal/workflow-types.ts lib/platform/durable-workflow-service.ts lib/agentic-journey/local-journey-runner.ts tests/help-me-go-somewhere-local-workflow.test.ts
git commit -m "feat: add local durable journey workflow"
```

### Task 9: Add Real Temporal Execution Behind the Existing Feature Flag

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/lib/workflows/temporal/temporal-client.ts`
- Modify: `apps/web/lib/workflows/temporal/temporal-worker.ts`
- Create: `apps/web/lib/workflows/temporal/workflows/help-me-go-somewhere.ts`
- Create: `apps/web/lib/workflows/temporal/activities/help-me-go-somewhere-activities.ts`
- Test: `apps/web/tests/temporal-help-me-go-somewhere.test.ts`

**Interfaces:**
- Consumes: Help Me Go Somewhere service/execution APIs and `WorkflowRun` mirror.
- Produces: optional Temporal workflow with signals/updates for participant approval, cancellation, service acceptance, disruption, recovery and completion.

- [ ] **Step 1: Add Temporal TypeScript SDK packages**

From `apps/web`:

```bash
pnpm add @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
pnpm add -D @temporalio/testing
```

Do not change `TEMPORAL_ENABLED` default.

- [ ] **Step 2: Write workflow replay/determinism tests before implementation**

Test:
- signal ordering;
- participant cancellation;
- worker cancellation;
- transport delay;
- participant mandate revocation while an Activity is retrying;
- worker restart/replay.

- [ ] **Step 3: Implement deterministic Workflow code**

The Workflow may use Temporal time, conditions, signals and activity proxies only. It must not import Prisma, Next.js request objects, provider SDKs or random/wall-clock helpers.

Public workflow:

```ts
export async function helpMeGoSomewhereWorkflow(
  input: HelpMeGoSomewhereWorkflowInput,
): Promise<HelpMeGoSomewhereWorkflowResult>
```

Signals include:
`participantApproved`, `participantChangedRequirements`, `participantRevokedMandate`, `workerAccepted`, `workerCancelled`, `transportAccepted`, `transportDelayed`, `transportCancelled`, `serviceStarted`, `serviceCompleted` and `humanCoordinatorDecision`.

- [ ] **Step 4: Implement Activities as thin adapters**

Each side-effecting Activity calls the existing deterministic application service, which re-checks current authority. Activities must be idempotent using mission/event keys or existing domain identifiers.

- [ ] **Step 5: Update the client/worker adapter**

When `TEMPORAL_ENABLED=true` and Temporal connectivity is valid, start the real workflow and mirror the run ID in `WorkflowRun`/mission fields. When false, use the local durable runner from Task 8. Do not silently fall back from a requested production Temporal run after partial external side effects; fail safe and surface the operational error.

- [ ] **Step 6: Run Temporal and fallback tests**

```bash
pnpm vitest run tests/temporal-help-me-go-somewhere.test.ts tests/help-me-go-somewhere-local-workflow.test.ts
pnpm type-check
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml lib/workflows/temporal tests/temporal-help-me-go-somewhere.test.ts
git commit -m "feat: add temporal journey orchestration"
```

### Task 10: Implement Disruption Recovery, Audit Completeness and Release Gates

**Files:**
- Create: `apps/web/lib/agentic-journey/recovery-service.ts`
- Modify: `apps/web/components/dashboard/agentic/JourneyCard.tsx`
- Create: `apps/web/components/dashboard/agentic/DisruptionRecoveryCard.tsx`
- Create: `apps/web/tests/help-me-go-somewhere-recovery.test.ts`
- Create: `apps/web/tests/e2e/agentic-dashboard.spec.ts`
- Modify: `apps/web/.env.example`
- Modify: `apps/mobile/.env.example`
- Modify: relevant CI workflow only after targeted tests pass.

**Interfaces:**
- Consumes: mission events, current Care/Transport states, authority grants and evidence state.
- Produces: participant-visible disruption state, bounded recovery proposals, audit-complete recovery actions.

- [ ] **Step 1: Write failing recovery tests**

Cover:
- worker cancelled with no pre-authorised replacement action -> show alternatives, do not assign;
- transport cancelled and accessible alternative unverified -> `manual_review_required`;
- participant revokes mandate during recovery -> stop new actions;
- human coordinator decision records who decided, why and correlation/workflow ID.

- [ ] **Step 2: Run the failing test**

```bash
pnpm vitest run tests/help-me-go-somewhere-recovery.test.ts
```

- [ ] **Step 3: Implement bounded recovery**

Recovery may:
- recompute timing impact;
- prepare alternatives;
- notify the participant;
- ask for approval;
- escalate to human help.

Recovery may not:
- auto-assign a worker;
- silently substitute an inaccessible/unverified vehicle;
- expand data sharing;
- reuse a revoked mandate.

- [ ] **Step 4: Add explicit feature flags**

Document default-off flags:

```env
MAPABLE_AGENTIC_DASHBOARD_ENABLED=false
MAPABLE_AGENTIC_JOURNEY_ENABLED=false
MAPABLE_AGENTIC_RECOVERY_ENABLED=false
TEMPORAL_ENABLED=false
```

The web UI may be enabled independently from execution features so the dashboard can be piloted read-only.

- [ ] **Step 5: Add end-to-end and accessibility tests**

The E2E test must prove this complete path:

Create/open outing -> review requirements -> choose option -> review sharing -> approve -> request services -> partial confirmation -> full confirmation -> simulated disruption -> bounded recovery choice -> completion -> evidence visible.

Also test keyboard-only traversal, axe, 200% zoom, reduced motion, and that a delayed/AAC user is not timed out by application logic.

- [ ] **Step 6: Run full targeted verification**

```bash
cd apps/web
pnpm vitest run \
  tests/agentic-dashboard-contracts.test.ts \
  tests/agentic-dashboard-read-model.test.ts \
  tests/agentic-dashboard-web.test.tsx \
  tests/agentic-dashboard-agency.test.tsx \
  tests/help-me-go-somewhere-state.test.ts \
  tests/help-me-go-somewhere-service.test.ts \
  tests/help-me-go-somewhere-execution.test.ts \
  tests/help-me-go-somewhere-local-workflow.test.ts \
  tests/temporal-help-me-go-somewhere.test.ts \
  tests/help-me-go-somewhere-recovery.test.ts \
  tests/authority/authority-grants.test.ts \
  tests/authority/authority-threats.test.ts \
  tests/transport-scheduling-routing.test.ts \
  tests/careos-production-foundation.test.ts
pnpm playwright test tests/a11y/agentic-dashboard.spec.ts tests/e2e/agentic-dashboard.spec.ts
pnpm type-check
pnpm lint

cd ../mobile
pnpm test
pnpm typecheck
pnpm build:web
```

Expected: all targeted checks PASS. Any pre-existing unrelated failure must be documented separately rather than “fixed” inside this feature branch.

- [ ] **Step 7: Verify Visual Truth and production-bundle separation**

In local development, compare Desktop/iPad/Phone against the approved Unified Accessible Dashboard target. Then verify the production bundle contains no Visual Truth import or editor runtime.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: harden agentic dashboard journey recovery"
```

### Task 11: Whole-Branch Review and Controlled Pilot Gate

**Files:**
- Review all files changed by Tasks 1–10.
- Update: `docs/superpowers/specs/2026-09-19-mapable-unified-agentic-dashboard-design.md` only if implementation evidence requires a clarification; do not rewrite approved principles.
- Create: `apps/web/docs/agentic-dashboard-pilot-evidence.md`

**Interfaces:**
- Consumes: complete branch and test evidence.
- Produces: review-ready pilot evidence pack; no production enablement.

- [ ] **Step 1: Capture evidence**

The evidence document records:
- feature flags and defaults;
- tested commit SHA;
- targeted test results;
- accessibility results;
- Temporal disabled-path result;
- Temporal enabled test result if configured;
- audit sample showing participant, actor, authority decision, action and workflow/correlation ID;
- known limitations;
- rollback procedure.

- [ ] **Step 2: Run final diff review**

Confirm:
- no duplicate participant identity;
- no duplicate authority ledger;
- no second care/transport source of truth;
- no AI direct write path;
- no production Visual Truth dependency;
- no auto-assignment;
- no autonomous payment release;
- no hidden stale-state action path.

- [ ] **Step 3: Request whole-branch code review**

Use the Superpowers requesting-code-review workflow against the feature branch. Treat review comments as evidence to evaluate, not instructions to apply blindly.

- [ ] **Step 4: Do not merge or enable production flags**

Stop with a review-ready branch and pilot evidence. Merge, deployment and production feature enablement require separate explicit authorisation.

## Rollback Strategy

- Web dashboard can be disabled independently via `MAPABLE_AGENTIC_DASHBOARD_ENABLED=false`.
- Journey creation/execution can be disabled via `MAPABLE_AGENTIC_JOURNEY_ENABLED=false` while retaining read-only dashboard capability.
- Recovery automation can be disabled via `MAPABLE_AGENTIC_RECOVERY_ENABLED=false`.
- Temporal can be disabled via `TEMPORAL_ENABLED=false` and the tested local durable path remains available.
- Existing `CareShift`, `TransportTrip`, authority grants and audit history remain canonical; rollback must not delete those rows.
- A rollback may hide a new surface or stop new journey actions; it must not erase participant records, consent history or audit evidence.
