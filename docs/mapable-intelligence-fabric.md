# MapAble Intelligence Fabric

## Purpose

The Intelligence Fabric is integrated into the existing MapAble application. It is not a separate lab, research dashboard, or prototype. It provides one participant-facing manager agent with specialist Care, Transport, Jobs, Access, Moves, Foods, and AbilityPay agents behind it.

The platform retrofit has two implemented surfaces:

1. a governed, read-only MapAble Core brief spanning selected modules; and
2. an accessible journey workflow that prepares a transport request and requires explicit participant confirmation before the existing transport service writes anything.

## Existing architecture retained

- Next.js App Router and existing `/ask` experience
- NextAuth session and permission checks
- Prisma data model and service layer
- Existing calendar, care, transport, jobs, access, billing, consent, audit, and agent-run services
- Existing Tailwind and UI components
- Existing non-AI service flows

## Platform architecture

```text
/ask participant interface
        |
        +--> /api/intelligence/platform-brief
        |          |
        |          +--> request-scoped consent
        |          +--> role and permission checks
        |          +--> read-only typed tool registry
        |          +--> Care | Transport | Jobs | Access | AbilityPay records
        |
        +--> /api/intelligence/journey
                   |
                   +--> MapAble manager agent
                   +--> Transport specialist
                   +--> signed approval proposal
                   +--> explicit participant confirmation
                   +--> existing createTransportTrip service
```

The manager agent remains responsible for participant-facing AI explanations. Specialist agents provide domain analysis but cannot write directly to application services or Prisma.

## MapAble Core retrofit

The Core brief lets a signed-in participant choose which MapAble areas may be read for one request. It currently supports:

- Core calendar appointments;
- Care requests;
- Transport trips and requests;
- published Jobs;
- published Access place evidence; and
- AbilityPay invoice summaries when the module is enabled.

Moves and Foods are represented in the shared architecture but remain disabled until governed read services are connected. Their specialist agents cannot invent or retrieve operational records.

Every registered tool declares:

- its MapAble module;
- whether it is read, draft, write, or restricted;
- required account permissions;
- required request-scoped consent; and
- its approved application service.

The Core brief is deterministic and read-only. It does not send model prompts, create transactions, or make eligibility, clinical, employment, or payment decisions.

## Request-scoped consent

The Core interface exposes module selection and accessibility-profile sharing as visible controls. Accessibility-profile sharing is off by default.

Supported request scopes are:

```text
core.summary
care.summary
transport.summary
jobs.summary
access.summary
moves.summary
foods.summary
payments.summary
profile.accessibility
```

These scopes exist for the current request only. They do not silently create durable consent records or cross-module permission.

## Safety boundaries

- Tools are classified as `read`, `draft`, `write`, or `restricted`.
- The Core registry currently executes read tools only.
- Existing role permissions are checked before each tool executes.
- Request-scoped consent is checked separately from role permission.
- Model output cannot create a trip.
- A signed, short-lived approval token contains the exact proposed transport action.
- The approval route validates session, permission, token signature, expiry, user identity, and the existing transport schema.
- The existing transport service performs the write and existing audit/event logic remains active.
- Standard non-AI routes remain available.
- Participant profile data is read only after a visible opt-in for that request.

Prohibited uses include automated support eligibility, clinical diagnosis, emotion recognition, disability severity scoring, autonomous employment rejection, unapproved bookings, unapproved payments, and unapproved sensitive disclosure.

## Environment variables

All values are server-side. Never prefix them with `NEXT_PUBLIC_`.

```env
OPENAI_API_KEY=
MAPABLE_AI_ENABLED=true
MAPABLE_AI_CORE_ENABLED=true
MAPABLE_AI_CARE_ENABLED=true
MAPABLE_AI_TRANSPORT_ENABLED=true
MAPABLE_AI_JOBS_ENABLED=true
MAPABLE_AI_ACCESS_ENABLED=true
MAPABLE_AI_MOVES_ENABLED=false
MAPABLE_AI_FOODS_ENABLED=false
MAPABLE_AI_PAYMENTS_ENABLED=false
MAPABLE_AI_MODEL_REASONING_ENABLED=true
MAPABLE_AI_WRITE_ACTIONS=false
MAPABLE_AI_MEMORY_ENABLED=false
MAPABLE_AI_AUDIT_ENABLED=true
MAPABLE_AI_APPROVAL_SECRET=replace-with-a-long-random-secret
```

`MAPABLE_AI_APPROVAL_SECRET` is required for approval tokens. During migration it can fall back to `NEXTAUTH_SECRET`, but a dedicated secret is recommended.

`MAPABLE_AI_ENABLED=false` disables all intelligence modules. Module flags provide smaller kill switches. Write actions, participant memory, Moves, Foods, and AbilityPay intelligence remain off by default.

When `OPENAI_API_KEY` is absent, or model reasoning is disabled, the journey slice uses a deterministic explanation while retaining the same approval controls. The Core platform brief is deterministic regardless of model availability.

## Installation and validation

```bash
pnpm install
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

The branch adds `@openai/agents`. Run `pnpm install` to update `pnpm-lock.yaml` before merging if the lockfile was not regenerated by the implementation environment.

## Core brief flow

1. Participant opens `/ask`.
2. Participant selects the MapAble modules to include.
3. Accessibility-profile use remains off unless selected.
4. `POST /api/intelligence/platform-brief` validates the request and signed-in session.
5. Each tool checks its module flag, account permission, request consent, and input schema.
6. The service returns per-module status, highlights, evidence source, and a standard non-AI route.
7. An audit event records module names and result statuses, not full sensitive record contents.
8. No booking, application, disclosure, invoice approval, claim, or payment occurs.

## Accessible journey flow

1. Participant opens `/ask`.
2. Participant supplies pickup and destination and may opt into accessibility-profile use.
3. `POST /api/intelligence/journey` reads the next calendar appointment.
4. MapAble generates advisory options and evidence.
5. The manager agent asks the Transport specialist for analysis and returns a structured explanation.
6. The UI clearly states that live availability has not been checked.
7. No database write occurs.
8. Participant presses **Confirm and create transport request**.
9. `POST /api/intelligence/approvals/transport` verifies the signed proposal and creates the request through the existing service.
10. Agent-run and audit records capture the workflow.

## Accessibility

The interfaces include:

- programmatic labels and fieldsets;
- visible keyboard focus;
- large interaction targets;
- status and error live regions;
- plain-language explanations;
- evidence and confidence disclosure;
- no pointer-only controls;
- explicit module and profile choices; and
- non-AI routes for essential functions.

Representative evaluation scenarios are stored in `intelligence/evaluation/scenarios.ts`. Core flag, consent, and request-contract tests are stored in `tests/intelligence-core-retrofit.test.ts`.

## Expansion path

Add approved service tools without bypassing the registry:

- Care: support request drafting and continuity summaries;
- Jobs: adjustment drafting and participant-controlled applications;
- Access: evidence-backed place comparison;
- Moves: clinician-approved plan coordination;
- Foods: preference-aware ordering drafts; and
- AbilityPay: invoice and budget explanation.

Draft and write tools must remain outside direct model control. Every consequential action requires a separate approval route that executes the existing deterministic application service.

## Rollback

### Entire intelligence layer

Set:

```env
MAPABLE_AI_ENABLED=false
```

### Individual modules

Set the relevant module flag to `false`, for example:

```env
MAPABLE_AI_PAYMENTS_ENABLED=false
```

### Disable model reasoning only

```env
MAPABLE_AI_MODEL_REASONING_ENABLED=false
```

The Core read-only brief continues to operate deterministically if enabled.

### Disable the interfaces

Remove `MapAbleCoreBrief` or `AccessibleJourneyAssistant` from `app/ask/AskPageClient.tsx`. Existing Copilot and standard service routes continue operating.

### Full code rollback

Revert the Intelligence Fabric pull request. It introduces no Prisma migration and does not alter existing authentication models. Existing approval tokens expire after 15 minutes and become unusable after a secret rotation.
