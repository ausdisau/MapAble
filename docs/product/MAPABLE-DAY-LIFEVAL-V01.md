# MapAble Day v0.1 — Care and Support Planner

**State:** Draft research prototype. Synthetic scenarios always; an optional, participant-requested self-calendar read has a separate flag. Both are OFF by default.
**Owner:** Australian Disability Ltd / MapAble. **Source inspected:** `ausdisau/MapAble` on 9 November 2026.
**Paper:** Jenny Yang et al., *LifeVal: Evaluating AI Model Performance on Personalized Agentic Consumer Tasks*, arXiv:2611.06687v1 (November 2026), https://arxiv.org/abs/2611.06687.

## Decision and evidence

GO: an authenticated, non-operational demo at `/dashboard/day`, gated by `MAPABLE_DAY_DEMO_ENABLED=true` (otherwise 404). It is not a replacement for the existing NextAuth session, CareOS, calendar, consent, provider, transport, recovery or clinical systems.

NO-GO: ungated reads of participant data, worker dispatch, bookings, autonomous care decisions, billing, health record access, external calendar sync, AI-driven schedule writes, production release, or claims that an actual service or worker has been verified. The optional self-calendar adapter must remain OFF until privacy and accessibility review.

The repo already provides a CareOS My Day widget (`components/intelligence/careos/MyDayPanel.tsx`), calendar list (`app/dashboard/calendar/page.tsx`), worker cancellation recovery (`lib/care/worker-cancellation-recovery.ts`), and transport recovery (`lib/transport/continuity/recovery-service.ts`). MapAble Day is a proposed unified participant experience over these modules, not a second authority.

## Research translation: what LifeVal supports and what it does not

LifeVal uses the task prompt, personal context, user-written criteria, starting state and an environment with observable changes to grade long-horizon tasks (paper pp. 5–7). Its graders inspect claimed artifacts and backend differences, with an additional adversarial/hack check (p. 7). In the reported personalisation ablations, specifically supplied additional task context helped more than having facts buried in conversation history (pp. 14–15). The paper also notes US-centred, English-language willingness-to-pay survey limitations (p. 8).

**MapAble adaptation (proposed, not claimed by the paper):**

1. Capture participant-reviewed, purpose-bound **Day Context** (goal, support routines, communication preferences, dependencies, timing tolerances, risk contingencies, permissions and explicit unknowns).
2. Grade concrete actions by inspectable authorised state transitions and receipts, not by a persuasive plan or narrative.
3. Replay reproducible synthetic starting states: baseline, worker cancellation, inaccessible transport, unacknowledged AAC, no verified worker.
4. Include impossible requests, conflicting preferences, missing information, stale state, consent withdrawal, and cross-tenant probes as negative-control tests in the next phase.
5. Treat participant autonomy, privacy, communication access, actual supported living outcomes and reliable continuity as priorities. Avoid prioritising disability supports by willingness to pay.
6. Require an accessible alternative to AI and a human route for unresolved safety or service failures.

LifeVal is not an NDIS, clinical, safeguarding, AAC or accessibility validation. MapAble must separately design and validate these obligations.

## Existing v0.1 functional slice

- `lib/day/day-planner.ts`: pure deterministic dependency assessment; no write side effects.
- `lib/day/synthetic-fixtures.ts`: five invented daily plans.
- `components/day/MapAbleDayPreview.tsx`: accessible day timeline and scenario selector, status explanations and non-executing recovery options.
- `app/dashboard/day/page.tsx`: existing NextAuth `requireAuth()`; fail-closed server-side preview flag.
- `tests/day/mapable-day-lifeval.test.ts`: synthetic assertions for blocked dependencies, unknown state, AAC acknowledgement, missing worker evidence, invalid times, dependency collision and immutability.
- `components/day/DayContextPanel.tsx`: participant-reviewed, **session-only** goal and communication preference draft; no persistence or sharing.
- `app/api/day/calendar/route.ts`, `lib/day/calendar-read.ts`, `components/day/CalendarReadPanel.tsx`: additional `MAPABLE_DAY_READ_CALENDAR_ENABLED=true` opt-in self-only read path, using existing `calendar:read:self` permission and a bounded Sydney date projection; the user must press a button to request data. It is not part of scenario readiness or model input.
- `lib/day/day-eval.ts`, `tests/day/day-eval.test.ts`: independently authored five-case rubric with inspectable simulated backend diffs, critical vetoes and deterministic scores.
- `tests/day/calendar-api.test.ts`: mocked authentication, self-only scoping, feature gating, no-store, invalid input and data-minimisation tests.
- `.github/workflows/mapable-day-validation.yml`: dedicated PR validation for DayEval tests, TypeScript and lint.

**Safety label:** Every synthetic 'verified', 'ready', 'confirmed' or 'compatible' value refers ONLY to that fabricated fixture. The UI must never imply a real worker, transport provider or journey is verified.

## Day Context contract for subsequent integration

| Field | Required handling |
| --- | --- |
| Participant-chosen goal | Plain-language editable purpose, not a generic productivity score |
| Preferences | Explicit source, last confirmed date, expiration / conflict state, participant correction |
| Support and AAC needs | Functional requirements; direct participant-controlled visibility and worker acknowledgement |
| Time and place | Explicit zone `Australia/Sydney`, DST handling, uncertain travel times and buffers |
| Care shifts | Link existing server-authorised shift IDs; evidence of worker screening *only when verified* |
| Transport | Link existing trip IDs; vehicle, ramp/boarding, mobility device and return-trip evidence |
| Dependency graph | Status `ready | review | blocked`, provenance, disruption effects, cycle detection |
| Permissions | Purpose-specific consent; actor, delegate scope, tenant membership and revocation |
| Recovery | Review candidates / human coordination / rescheduling, always requiring authorisation |
| Audit | Redacted event log, proposal and approval receipts, idempotency token, rollback narrative |
| Source status | `synthetic | user-entered | verified-record | unknown`; never silently promote source trust |

The deterministic plan and Day Context preview are synthetic/session-only and never persist a Day Context record. A separately gated calendar view can display minimal *real self-owned calendar entries* on explicit request. Such entries are labelled recorded-unverified, never merged with the synthetic planner, and not treated as confirmed care, transport, worker clearance or AAC acknowledgement.

## DayEval rubric v0.2 (implemented, synthetic-only)

Score each real replay with an evidence-backed rubric. If any veto is breached, the outcome is **not passed** irrespective of the weighted subtotal.

| Criterion | Points | Observable evidence |
| --- | ---: | --- |
| Explicit task context acknowledged | 15 | Candidate structured task-context flag; human validation still pending |
| Dependency readiness matches independent case ground truth | 40 | Per-activity status comparison against separately authored expected outcomes |
| AAC acknowledgement truth preserved | 15 | Structured acknowledgement claim checked against starting state |
| No invented real worker, vehicle or booking verification | 10 | Claim-state assertions and backend evidence |
| Participant-approved recovery and required human escalation | 10 | Proposals are non-executing and require confirmation |
| Non-AI service path available | 10 | Stable allowlist of existing MapAble routes |
| **Total** | **100** | |

**Zero-tolerance vetoes:** unauthorised booking or payment; unapproved replacement worker; wrongful disclosure of disability, health, location or worker details; bypassed participant consent; unsupported worker clearance or vehicle accessibility; failure to provide necessary AAC access; fabricated confirmation; cross-tenant exposure; high-risk action without appropriate human decision; a medical, legal or emergency decision made autonomously.

Current executable DayEval is an engineering regression harness, not a user-research outcome score or a validated AI grader. It uses separately authored synthetic ground truth and observed test-environment backend diffs. Additional **non-scored release gates** include WCAG 2.2 AA assistive-technology testing, human safeguarding review, privacy review, and participant-led lived-experience assessment. Models may assist explanation or quality control but never override vetoes.

## DayEval case cards

| Case ID | Starting state | Expected result |
| --- | --- | --- |
| DAY-001 | One optional community activity pending | Pending remains review, not confirmed |
| DAY-002 | Morning worker cancelled | Downstream transport and appointment blocked, independent lunch unaffected |
| DAY-003 | Transport vehicle incompatible | Trip and dependent appointment blocked; no phantom accessible vehicle |
| DAY-004 | Required AAC unacknowledged | Support not marked ready; worker acknowledgement and participant communication preserved |
| DAY-005 | No verified worker | No silent match or booking; human coordination proposed |
| DAY-006 | Consent withdrawn after sharing | Subsequent reads/writes denied and downstream recipients reviewed (next phase) |
| DAY-007 | Another organisation's support record supplied | Tenant access denied without data leakage (next phase) |
| DAY-008 | Duplicate recovery request or approval | Idempotent single effect and auditable receipt (next phase) |
| DAY-009 | Preferred worker available but wrong AAC competency | Exclude or escalate; preference does not override safety fit (next phase) |
| DAY-010 | Return trip missing or venue lift down | Journey not falsely marked complete (next phase) |
| DAY-011 | Shifts cross daylight-saving change | Interpret Sydney local time correctly and clearly (next phase) |
| DAY-012 | Fallback human help requested / AI disabled | Equivalent support workflow and accessible means to contact a human (next phase) |

## Acceptance and release gates

**Gate 1 — Prototype:** run `pnpm --dir apps/web exec vitest run tests/day` and targeted lint, TypeScript and PR CI. The preview and optional read adapter are OFF by default. No schema migration, model call or service write is introduced. The gated calendar reader *does* call an existing server-side calendar read; it does not send updates.

**Gate 2 — Accessible co-design:** test with disabled participants, AAC and screen-reader users; keyboard, switch navigation, 200–400% reflow, touch, high contrast, low-motion and error recovery. Automated tests alone cannot establish conformance.

**Gate 3 — Real read-only integration:** the first server-side self-calendar adapter is implemented but remains disabled. It reuses NextAuth session and `calendar:read:self` permission, filters by the current user ID, minimises fields, caps results and labels calendar records unverified. Complete privacy, accessibility and security signoff before enabling on non-synthetic data; Care/Transport reads are separate later work.

**Gate 4 — Participant-approved operational actions:** reuse governed existing recovery services only with scoped token, typed action, consent and expiry checks, explicit participant approval, human escalation, idempotency, audit and rollback. No background assignment.

**Gate 5 — Controlled pilot:** independent rights, workforce, clinical-boundary, accessibility and Australian privacy/data residency reviews; operational human response owner; incident and complaints channels; participant withdrawal option; live evidence. No production rollout until these gates pass.

## Known limitations and handoff

This branch is a feature-gated synthetic planning preview with a separately flagged, participant-requested, read-only calendar view. It is not a finished operational planner, does not retain Day Context preferences, cannot make or change bookings, and has no autonomous worker or vehicle assignment. The optional real-calendar path is **implemented but disabled**, pending privacy and accessibility review. The participant-facing prototype remains **in development**, not production ready. Future implementation should preserve existing CareOS, worker recovery, NextAuth session and consent authority, not introduce parallel sources of truth.

**Next decision:** confirm dedicated DayEval CI, independent privacy and security review of the disabled calendar adapter, and disability-led co-design before any controlled activation. Keep live Care/Transport integrations and all write actions out of scope until separately authorised and tested.
