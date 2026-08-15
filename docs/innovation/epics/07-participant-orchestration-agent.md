# Epic 07 — Participant Orchestration Agent

> **Azure DevOps Epic key:** `mapable-epic-07-participant-orchestration-agent`  
> **Priority:** P2 | **Horizon:** Controlled Intelligence Wave  
> **Current claim state:** In development

---

## 1. Epic title

Participant Orchestration Agent

## 2. Epic ID / proposed slug

`mapable-epic-07-participant-orchestration-agent`

## 3. Strategic outcome

Participant-controlled conversational planning across MapAble modules.

## 4. Participant outcome

One place to explore options and approve plans — AI proposes, I decide, system executes only what I approve.

## 5. Problem statement

Journey planning spans jobs, access, navigate, transport, care, calendar — participants coordinate manually.

## 6. Scope

Search, compare, explain, dependencies, draft plans, suggest options. MODEL PROPOSES → POLICY VALIDATES → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.

## 7. Explicit non-goals

Autonomous booking; silent spend; disability disclosure; clinical/reportability decisions; multi-agent swarm.

## 8. User groups

Participants, delegates (limited), support coordinators (read with consent).

## 9. Example user journeys

1. Interview Tuesday Parramatta: agent drafts plan with route, transport, optional care prep — participant approves each step.
2. User revokes passport mid-plan; agent strips scoped data and offers non-AI fallback.
3. Unsafe auto-book attempt blocked; escalation to human.

## 10. Functional capabilities

- Single orchestrator with typed tools and constrained schemas
- Read aggregation from Jobs/Access/Navigate/Transport/Care/Calendar
- Approval gates before consequential execution
- Non-AI deterministic fallback planner
- Full audit and eval suite (15 cases minimum)

## 11. Shared Core dependencies

AuditEvent, ConsentRecord, FeatureFlag, AgentRun, Notification, Task.

## 12. Cross-Epic dependencies

Requires E02, E03, E08. Reads Care/Transport/Jobs.

## 13. Data entities

AgentRun, AiMatchRun, approval records, plan drafts.

## 14. APIs/events required

/api/ai/orchestrator/*; events: PlanProposed, PlanApproved, ExecutionCompleted.

## 15. Permission model

Participant approves; delegate bounds; tools RBAC per role.

## 16. Consent requirements

Passport scopes per module; no prompt injection of undisclosed fields.

## 17. Human approval gates

Every book/spend/share action; funding questions advisory only.

## 18. Accessibility acceptance criteria

- WCAG 2.2 AA on all user-facing surfaces
- Semantic HTML; keyboard navigation; visible focus; skip links where applicable
- Screen-reader labels on all interactive controls; live regions for dynamic updates
- Zoom to 400%; reflow at 320px; contrast ≥ 4.5:1
- Reduced motion; accessible errors; non-drag map alternatives; touch targets ≥ 44×44px
- Switch access; voice-independent workflows; plain-language and Easy Read for consent/plans
- AAC-compatible text interfaces; predictable focus; accessible auth and session timeout
- Manual AT testing (NVDA/VoiceOver + keyboard) before G5 — automated alone insufficient

## 19. Privacy requirements

Minimum context in model calls; trace retention policy.

## 20. Safeguarding requirements

Escalation for abuse/clinical questions — human only.

## 21. AI use, if any

Search, summarisation, explanation, drafting, planning, recommendation.

## 22. AI prohibited decisions

Assign workers; book without approval; disclose disability; spend; approve funding; clinical decisions; reportability; restrictive practices.

## 23. AI eval requirements

| Case | Expected |
|------|----------|
| Normal success | Valid output within authority |
| Missing evidence | States unknown; no fabricated facts |
| Conflicting evidence | Surfaces conflict; asks participant |
| Stale information | Shows freshness; warns user |
| User refuses recommendation | Accepts; offers alternatives |
| User revokes consent | Stops processing scoped data |
| Delegate lacks authority | Blocks with accessible message |
| Required tool unavailable | Non-AI fallback offered |
| Unsafe requested action | Refuses; escalates |
| Disclosure attempt | Blocks; logs audit event |
| Hallucinated accessibility fact | Caught by eval; not shown as verified |
| Incorrect funding claim | Advisory wording only |
| Escalation required | Routes to human |
| Accessibility fallback required | Non-AI path completes task |
| Cohort disparity | Flagged in monitoring |

## 24. Audit requirements

Full tool call trace; approval records immutable.

## 25. Observability requirements

Task success; forbidden action blocks; escalation precision.

## 26. Complaints/correction path

Agent harm report; disable agent per participant.

## 27. Feature flags

MAPABLE_NAVIGATOR_PILOT_* (extend); new ORCHESTRATOR_ENABLED proposed.

## 28. Failure and fallback behaviour

Step-by-step manual planner UI; human support coordinator handoff.

## 29. Security requirements

Tool allowlist; prompt injection defenses; no PCI/clinical in context.

## 30. Definition of Ready

G0–G2; E02/E03/E08 pilot ready.

## 31. Definition of Done

15 eval cases pass; zero silent executions in pilot.

## 32. MVP acceptance criteria

Draft plan only; no execution.

## 33. Pilot acceptance criteria

Approve→execute for transport quote request only.

## 34. Scale acceptance criteria

Additional modules gated by eval evidence.

## 35. KPIs

Task success; unsupported-claim rate; forbidden attempts blocked.

## 36. Risks

R03 autonomous execution; R17 multi-agent complexity.

## 37. Mitigations

Approval gates; one agent; eval suite.

## 38. Dependencies

E02, E03, E08 hard.

## 39. Recommended owner/team

AI Platform Team

## 40. Delivery horizon

Controlled Intelligence Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

Navigator governed pilot experimental (flags off). Distinct programme orchestrator not verified live.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-07-participant-orchestration-agent-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-07-participant-orchestration-agent-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-07-participant-orchestration-agent-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-07-participant-orchestration-agent-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-07-participant-orchestration-agent-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-07-participant-orchestration-agent-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-07-participant-orchestration-agent-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Single orchestrating agent shell | EXTEND | `Navigator pilot, lib/ai/platform/` |
| 2 | Typed tools + constrained schemas | EXTEND | `tool registry` |
| 3 | Propose → validate → approve → execute | NEW | `policy services` |
| 4 | Cross-module read aggregation | EXTEND | `vertical APIs read-only` |
| 5 | Approval gates + audit events | REUSE | `AuditEvent, AgentRun` |
| 6 | Non-AI fallback planner | NEW | `deterministic path` |
| 7 | Orchestration eval suite | EXTEND | `pnpm ai:evals` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Starting Work pilot shows manual coordination pain | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Propose→approve→single tool execute with audit | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
