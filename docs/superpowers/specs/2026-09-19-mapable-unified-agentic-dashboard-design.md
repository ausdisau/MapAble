# MapAble Unified Agentic Dashboard — Design Specification

**Status:** Approved architecture; design specification for review  
**Date:** 2026-09-19  
**Repository:** `ausdisau/MapAble`  
**Branch:** `design/unified-agentic-dashboard`  
**Primary surfaces:** `apps/web`, `apps/mobile`  
**First vertical slice:** My Day + Help Me Go Somewhere (Care + Transport)

## 1. Decision

Build a shared MapAble dashboard experience in which:

- the web application establishes the visual source of truth using the MapAble Unified Accessible Dashboard skin and Visual Truth during local development;
- the Expo/React Native mobile application implements the same product language using shared tokens and shared domain contracts rather than DOM-derived styling;
- MapAble Core remains authoritative for identity, consent, participant authority, audit and domain execution;
- Temporal is used only for durable, long-running service coordination where retries, waits, signals and recovery are justified;
- the Participant Graph supplies the participant-centred read model joining goals, access requirements, communication preferences, people, services, transport, evidence, consent and outcomes;
- the first implemented journey is a bounded Care + Transport flow: **Help Me Go Somewhere**.

The product objective is not to maximise automation. It is to reduce coordination burden while preserving participant authorship, reversibility and accessible human escalation.

## 2. Source-of-truth hierarchy

Implementation decisions must use this priority:

1. current code and configuration in `ausdisau/MapAble`;
2. current official regulator, standards and platform documentation when required;
3. approved MapAble strategy and roadmap documents;
4. older business plans and market assumptions;
5. explicitly labelled inference.

No wireframe, pitch, roadmap item or mockup is proof that a capability is live.

## 3. Verified current state

### Repository topology

The canonical repository contains:

- `apps/web` — Next.js 15 web application;
- `apps/mobile` — Expo 57 / React Native 0.86 mobile application.

### Web implementation

The web application currently includes:

- Next.js;
- React;
- Tailwind CSS;
- Radix-compatible component patterns;
- Vitest;
- Playwright and axe accessibility testing;
- Prisma;
- existing CareOS / agentic support code paths;
- a Temporal scaffold behind `TEMPORAL_ENABLED`.

### Mobile implementation

The mobile application currently includes:

- Expo;
- React Native;
- React Navigation;
- React Native Web support;
- TypeScript.

### Temporal implementation

Temporal currently exists as a scaffold in the web tree. It is not assumed to be production-enabled. The design preserves the existing default-off posture and requires a Postgres-backed or otherwise deterministic local mirror/fallback until the durable worker deployment is explicitly proven.

## 4. Product principles

### 4.1 Participant authorship

The participant owns the decision. MapAble may:

- inform;
- compare;
- recommend;
- prepare;
- execute only within an explicit mandate.

MapAble must not infer that a supporter, nominee, provider, worker, organisation membership or AI agent has participant authority unless that authority is explicitly represented.

### 4.2 Functional access, not diagnosis-first UX

The dashboard is driven by functional requirements:

- communication mode;
- mobility equipment;
- sensory access;
- physical access;
- timing/fatigue constraints;
- transport access requirements;
- support preferences.

Diagnosis may be relevant context where the participant chooses to use it, but it is not a substitute for functional access data.

### 4.3 Human access remains first-class

Every consequential flow provides an accessible path to human help. The user must never be trapped inside an AI-only flow.

### 4.4 Safety does not erase dignity of risk

The interface may surface:

- risk;
- uncertainty;
- unverified access;
- alternatives;
- consequences.

It must not silently convert those signals into paternalistic cancellation or substitution of the participant's decision.

### 4.5 Evidence-honest state

The UI must distinguish states such as:

- verified;
- participant-confirmed;
- provider-reported;
- awaiting confirmation;
- unavailable;
- stale;
- manual review required;
- failed;
- cancelled.

Colour alone must never communicate state.

## 5. Information architecture

### Primary participant navigation

Desktop:

1. Home
2. My Day
3. Support
4. Transport
5. Access
6. Documents
7. Money & Agreements
8. Messages
9. My Agency
10. Help

Mobile bottom tabs:

1. Home / My Day
2. Support
3. Transport
4. Access
5. More

Mobile `More` contains:

- My Agency;
- Documents;
- Money & Agreements;
- Messages;
- Profile;
- Help.

### Role-aware navigation

The navigation shell is role-aware but must not duplicate identity. Supported role contexts include:

- participant;
- nominee / representative;
- worker;
- provider admin;
- finance admin;
- platform admin.

A person with multiple roles switches context explicitly. Role switching must not silently change participant authority.

## 6. Unified Accessible Dashboard layout

The MapAble Unified Accessible Dashboard skin is the visual reference for the web implementation.

### 6.1 Header

Contains:

- MapAble identity;
- current participant/person context;
- communication mode indicator where useful;
- accessibility preferences;
- notifications;
- human help;
- account / role context.

### 6.2 Primary content hierarchy

The participant dashboard prioritises:

1. **My Day**
2. **Agency & Consent**
3. **Upcoming Support**
4. **Journey**
5. **Support Network**
6. **Goals**
7. **Access Profile**
8. **Documents & Agreements**
9. **Money & Evidence**
10. **Messages & Help**

### 6.3 My Day

A chronological timeline joining service and travel events.

Each event can show:

- time window;
- event type;
- provider / worker;
- transport connection;
- status;
- unresolved decision;
- fallback;
- evidence state.

The timeline is not merely a calendar. It is a participant-centred orchestration view.

### 6.4 Agency & Consent

A persistent, understandable surface answering:

- Who can see my information?
- Who may act for me?
- What may MapAble do automatically?
- What requires my approval?
- What expires soon?
- What can I revoke now?

The UI uses the authority levels:

- Inform
- Recommend
- Prepare
- Act within mandate

No AI agent can elevate its own authority.

### 6.5 Support Network

Shows:

- chosen workers;
- providers;
- nominees;
- supporters;
- coordinators;
- trusted transport providers.

Each relationship includes:

- role;
- current status;
- authority scope;
- sharing scope;
- expiry/review date where relevant;
- change/revoke action.

### 6.6 Participant Graph summary

Do not expose a technical graph by default.

Present the graph as understandable connected groups:

- My goals;
- My people;
- My services;
- My journeys;
- My permissions;
- My records;
- My evidence.

A technical node-edge view may be available to staff/admin users if operationally useful.

## 7. First vertical slice — Help Me Go Somewhere

### 7.1 User goal

A participant wants to attend an appointment, event, workplace, community activity or other destination and needs both support and accessible transport.

### 7.2 Entry criteria

The slice may start when:

- the participant creates an outing;
- an existing calendar/service event requires a journey;
- a support booking has no transport attached;
- a transport request requires a support worker.

### 7.3 Required inputs

Minimum information:

- destination;
- date/time;
- access requirements;
- transport requirements;
- whether support is needed;
- required communication context;
- participant-controlled sharing permissions.

Optional information:

- preferred worker/provider;
- preferred transport provider;
- budget or price constraints;
- time buffers;
- return-trip requirements;
- backup preferences.

### 7.4 Journey

1. Participant creates or opens the outing.
2. System shows known access and timing requirements.
3. Participant corrects or confirms them.
4. System prepares Care and Transport options.
5. Options display evidence, fit reason and uncertainty.
6. Participant selects or asks for alternatives.
7. System shows exactly what information will be shared and with whom.
8. Participant grants or reuses an appropriate mandate.
9. MapAble creates bounded service requests.
10. Provider / worker / transport responses update the journey.
11. Participant sees confirmed and unresolved parts in one timeline.
12. On disruption, the workflow attempts only pre-authorised recovery actions.
13. Any action outside mandate returns to the participant or human coordinator.
14. Service completion is recorded.
15. Evidence and billing context become visible.
16. Participant can correct the record, complain or report an incident.

### 7.5 Exit criteria

The slice ends in one of these explicit states:

- completed;
- participant-cancelled;
- provider-cancelled with unresolved recovery;
- transport-cancelled with unresolved recovery;
- expired;
- failed safely.

No ambiguous `done` state is permitted.

## 8. Transaction state model

Use an explicit transaction state machine rather than inferring state from UI events.

Suggested high-level states:

```text
draft
→ needs_requirements
→ options_ready
→ awaiting_participant_choice
→ awaiting_mandate
→ requesting_services
→ partially_confirmed
→ confirmed
→ in_progress
→ disrupted
→ recovering
→ completed
→ evidence_ready

Terminal alternatives:
cancelled_by_participant
cancelled_by_provider
failed_safe
expired
```

Care and Transport sub-records maintain their own domain states while the parent journey exposes a participant-readable composite state.

## 9. Participant authority and mandate model

Every consequential action passes through a deterministic authority decision point.

Minimum mandate fields:

- principal participant;
- delegate / actor;
- domain;
- authority level;
- allowed actions;
- prohibited actions;
- data scope;
- purpose;
- time window / expiry;
- spending or commitment threshold where relevant;
- approval threshold;
- revocation state;
- evidence / audit reference.

Rules:

- organisation membership is not participant authority;
- family relationship is not participant authority;
- worker assignment is not authority;
- AI recommendation is not authority;
- a mandate can only narrow or express authority already validly granted;
- revocation blocks future use immediately;
- completed historical audit evidence remains immutable.

## 10. Core / Participant Graph read model

The dashboard consumes a participant-centred read model rather than directly querying unrelated domain tables.

The read model joins at minimum:

- participant identity;
- user role/context;
- access requirements;
- communication preferences;
- mobility aids;
- goals;
- participant relationships;
- consents;
- authority grants;
- service agreements;
- care records;
- transport records;
- documents;
- invoices;
- incidents;
- complaints;
- audit events;
- attestations;
- locations.

Relational storage remains acceptable. A separate graph database is not required for this slice.

## 11. Web architecture

### 11.1 Visual Truth role

Visual Truth is local-development tooling for establishing visual truth on `apps/web`.

It may be used to:

- select live dashboard elements;
- refine spacing and hierarchy;
- verify responsive states;
- capture exact Desktop / iPad / Phone dimensions;
- produce durable source changes after review.

It must remain development-only and must not become a production dependency.

### 11.2 Web surface responsibilities

The web dashboard owns:

- desktop/tablet command-centre layout;
- rich participant graph summary;
- staff/admin operational detail;
- full consent/mandate management;
- detailed evidence and audit views.

## 12. React Native mobile architecture

### 12.1 Native-first implementation

The mobile app must not be a screenshot port of the web dashboard.

It shares:

- design tokens;
- domain types;
- API contracts;
- status vocabulary;
- accessibility language;
- authority semantics.

It uses native interaction patterns appropriate to React Native.

### 12.2 Navigation

Use React Navigation with:

- bottom tabs for primary participant tasks;
- stack navigation for detail flows;
- modal/sheet patterns only where accessibility behavior is verified;
- deep links for service events where safe.

### 12.3 Mobile component priorities

Initial components:

- `MyDayTimeline`
- `AgencyStatusCard`
- `JourneyCard`
- `SupportEventCard`
- `TransportEventCard`
- `AccessRequirementSummary`
- `ConsentShareSheet`
- `MandateReviewScreen`
- `HumanHelpAction`
- `DisruptionRecoveryCard`

### 12.4 React Native performance constraints

Avoid:

- large unvirtualised timelines;
- unnecessary global re-renders;
- JS-thread-heavy animation;
- giant context providers carrying all participant state.

Prefer:

- list virtualisation where needed;
- memoised leaf components;
- stable callbacks;
- network/domain state separated from transient UI state;
- reduced-motion-aware transitions.

## 13. Temporal durable workflow design

### 13.1 Use case

Temporal is justified only for the long-running coordination process after the participant has expressed intent and a valid mandate exists.

### 13.2 Workflow

Suggested workflow name:

`HelpMeGoSomewhereWorkflow`

The Workflow coordinates state but does not grant authority.

### 13.3 Signals / updates

Potential external events:

- `participantApproved`
- `participantChangedRequirements`
- `participantRevokedMandate`
- `workerAccepted`
- `workerCancelled`
- `providerRejected`
- `transportAccepted`
- `transportDelayed`
- `transportCancelled`
- `serviceStarted`
- `serviceCompleted`
- `humanCoordinatorDecision`

### 13.4 Activities

Activities perform side effects only after an authority check.

Examples:

- request provider option;
- request transport option;
- send participant notification;
- record service response;
- prepare alternative;
- write service record;
- write audit event;
- prepare invoice/evidence context.

### 13.5 Determinism

Workflow code must not directly:

- call external services without Activities;
- read wall-clock time outside Temporal APIs;
- generate random IDs nondeterministically;
- query mutable participant data without an explicit versioned snapshot or Activity result.

### 13.6 Authority gate

Before a side-effecting Activity:

1. load current mandate/authority evidence through an Activity;
2. validate action, actor, purpose, expiry and limits in deterministic application code;
3. create an action token or authority decision record;
4. execute the domain action;
5. record the receipt/audit result.

A prior approval does not override a later revocation.

### 13.7 Feature gating

Temporal remains behind `TEMPORAL_ENABLED`.

The first implementation must preserve the current non-Temporal path until:

- worker deployment exists;
- workflow replay tests pass;
- production observability exists;
- rollback has been tested.

## 14. Failure and recovery design

### 14.1 Worker/provider cancellation

If a worker cancels:

- show the participant immediately;
- preserve the existing booking record;
- attempt only pre-authorised recovery;
- do not auto-assign a replacement;
- show alternatives with fit/evidence;
- escalate to human help if continuity risk cannot be resolved.

### 14.2 Transport disruption

If transport is delayed/cancelled:

- recompute timing impact;
- preserve destination and participant goal;
- show accessible alternatives;
- make uncertainty visible;
- do not silently substitute an unverified vehicle/provider;
- keep the return-trip requirement visible.

### 14.3 Consent/mandate revocation

On revocation:

- stop new external actions;
- cancel pending actions where safely cancellable;
- preserve historical audit data;
- notify the participant of any commitments that could not be reversed.

### 14.4 Offline / network failure

The mobile client must:

- clearly distinguish cached from current state;
- never present stale confirmation as live;
- queue only actions proven safe to defer;
- require revalidation before consequential external action after reconnection.

## 15. Accessibility acceptance criteria

Release-blocking criteria:

- WCAG 2.2 AA baseline for web;
- keyboard-complete navigation;
- visible focus;
- no colour-only meaning;
- screen-reader names/roles/states;
- zoom and reflow without loss of essential function;
- reduced-motion support;
- accessible error identification;
- minimum target sizes consistent with WCAG 2.2 guidance;
- native Dynamic Type support on mobile;
- VoiceOver and TalkBack critical-flow testing;
- switch-control-compatible navigation;
- AAC-friendly concise action labels;
- plain-language presentation option;
- no forced timeout for participant decisions unless the external service genuinely requires one;
- human help available from each consequential flow.

The product must not infer decision-making incapacity from speech, AAC use, slow response, motor impairment or communication difficulty.

## 16. Audit and observability

Every consequential transition should produce structured evidence including:

- participant/principal;
- actor;
- role/context;
- mandate/consent reference;
- requested action;
- authority decision;
- service/provider target;
- timestamp;
- result;
- failure reason;
- human escalation if any;
- correlation/workflow ID.

The participant-facing audit view uses plain-language summaries. Operational logs may expose deeper technical detail to authorised staff.

## 17. Privacy and data minimisation

Rules:

- only send the minimum required participant information to providers, workers, transport operators and AI services;
- sharing is purpose-bound;
- location sharing is time-bound where possible;
- sensitive data is not placed in general-purpose prompts by default;
- models do not receive direct unrestricted database credentials;
- model output is treated as a proposal, not authority;
- participant corrections propagate into the source-of-truth record without deleting historical audit evidence.

## 18. Testing strategy

### 18.1 Web

- unit tests for status/authority rendering;
- component tests for accessible interaction;
- Playwright critical journeys;
- axe checks;
- visual regression against approved Visual Truth states where practical.

### 18.2 Mobile

- TypeScript type checking;
- navigation tests;
- component tests for state transitions;
- VoiceOver/TalkBack manual critical-flow checks;
- Dynamic Type layout checks;
- reduced-motion checks;
- offline/stale-state tests.

### 18.3 Domain/API

- authority decision tests;
- consent revocation tests;
- service-state tests;
- idempotency tests;
- access-fit provenance tests;
- audit completeness tests.

### 18.4 Temporal

- Workflow replay tests;
- signal ordering tests;
- retry tests;
- cancellation tests;
- revocation-during-retry tests;
- activity timeout tests;
- worker restart tests;
- Temporal-disabled fallback tests.

## 19. Rollout and feature flags

Initial flags should independently gate:

- unified participant dashboard;
- mobile My Day;
- agency/mandate surface;
- Care + Transport linked journey;
- disruption recovery;
- Temporal-backed orchestration.

Default new high-impact capabilities to off until validation evidence exists.

## 20. Non-goals for the first slice

Do not include:

- full care marketplace;
- full transport marketplace;
- autonomous worker assignment;
- autonomous payment release;
- clinical treatment decisions;
- restrictive-practice decisions;
- capacity assessment;
- emergency-service replacement;
- full job board;
- general-purpose AI access to Core databases;
- continuous household surveillance;
- emotion recognition;
- a new graph database.

## 21. Definition of done for the design slice

The design is implementation-ready when:

1. the dashboard information architecture is approved;
2. the web visual target is established from the Unified Accessible Dashboard skin;
3. mobile navigation and component mapping are approved;
4. Participant Graph read-model fields are mapped to existing schemas or explicit additions;
5. mandate/authority contracts are explicit;
6. the Help Me Go Somewhere transaction states are fixed;
7. Temporal boundaries and fallback behavior are fixed;
8. accessibility acceptance criteria are testable;
9. failure/recovery paths are defined;
10. the implementation plan can be split into small TDD increments without redesigning the architecture.

## 22. Planned implementation sequence after spec approval

The implementation plan should decompose into separate testable increments:

1. shared status/authority/domain contracts;
2. web dashboard shell + Visual Truth local integration;
3. Participant Graph read model;
4. My Agency / consent and mandate surfaces;
5. mobile My Day shell;
6. linked Care + Transport transaction model;
7. non-Temporal orchestration path;
8. Temporal workflow behind feature flag;
9. disruption/recovery;
10. accessibility, replay, audit and rollback verification.

No implementation starts from this document alone. The next required step is a separate Superpowers implementation plan after human review of this specification.
