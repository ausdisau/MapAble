# Epic 11 — Employment Accessibility Graph

> **Azure DevOps Epic key:** `mapable-epic-11-employment-accessibility-graph`  
> **Priority:** P2 | **Horizon:** Participation Wave  
> **Current claim state:** In development

---

## 1. Epic title

Employment Accessibility Graph

## 2. Epic ID / proposed slug

`mapable-epic-11-employment-accessibility-graph`

## 3. Strategic outcome

Expand Jobs beyond conventional matching with access, adjustments, transport, optional support — candidate-controlled disclosure.

## 4. Participant outcome

Apply and interview without automatically revealing disability; request adjustments and viable commute on my terms.

## 5. Problem statement

Job matching ignores workplace access and commute; disclosure defaults harm candidates.

## 6. Scope

Job ↔ skills ↔ workplace access ↔ adjustments ↔ transport ↔ optional support. Interview accessibility, placement sustainability, employer improvements feeding graph.

## 7. Explicit non-goals

Employability scoring; auto-reject; disability inference; automatic employer disclosure.

## 8. User groups

Job seekers, employers, support coordinators, interviewers.

## 9. Example user journeys

1. Candidate applies with zero disability fields visible to employer; requests interview adjustments separately.
2. System shows commute suitability using E03 without sharing passport to employer.
3. Placement sustainability check at 13 weeks with transport plan.

## 10. Functional capabilities

- Workplace accessibility profiles linked to E01
- Disclosure gates per application stage
- Adjustment request workflow
- Commute compatibility via E03

## 11. Shared Core dependencies

Employer, Job, Application, AdjustmentRequest, AccessPassport (scoped), AuditEvent.

## 12. Cross-Epic dependencies

E01 workplace access; E02 disclosure; E03 commute; optional E07.

## 13. Data entities

Job, JobApplication, EmploymentProfile, EmployerAccessibilityEvidence, InterviewEvent.

## 14. APIs/events required

/api/jobs/*; /api/employer/accessibility/*.

## 15. Permission model

Employer sees only consented fields; candidate controls each disclosure.

## 16. Consent requirements

Per-employer/per-stage scopes; Easy Read for adjustment sharing.

## 17. Human approval gates

Any bulk disclosure; employer access profile publication.

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

No inference of disability from behavior; fairness hard-offs enforced in code.

## 20. Safeguarding requirements

No AI employability score; human review for contested matches.

## 21. AI use, if any

Explain match factors using non-disclosing attributes only.

## 22. AI prohibited decisions

Employability score; auto-reject; infer disability; share passport without scope.

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

Disclosure events per application stage.

## 25. Observability requirements

Disclosure rate (should be participant-driven); retention metrics.

## 26. Complaints/correction path

Discrimination complaint path; adjustment dispute.

## 27. Feature flags

MAPABLE_JOBS_PARTICIPATION_ENABLED.

## 28. Failure and fallback behaviour

Manual application without smart matching.

## 29. Security requirements

Employer tenant isolation.

## 30. Definition of Ready

G0–G2; fairness review with DRO.

## 31. Definition of Done

Interview journey in vertical slice with disclosure control.

## 32. MVP acceptance criteria

Workplace profile + adjustment request on apply.

## 33. Pilot acceptance criteria

Starting Work employer path with commute plan.

## 34. Scale acceptance criteria

Retention tracking 13/26/52 weeks.

## 35. KPIs

Interview accessibility; adjustment fulfilment; retention.

## 36. Risks

R04 employer disclosure; bias in matching.

## 37. Mitigations

Default zero disclosure; deterministic fairness rules.

## 38. Dependencies

E01, E02, E03.

## 39. Recommended owner/team

Jobs Platform Team

## 40. Delivery horizon

Participation Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

Jobs foundation + participation flags exist; employment-access graph not verified live.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-11-employment-accessibility-graph-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-11-employment-accessibility-graph-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-11-employment-accessibility-graph-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-11-employment-accessibility-graph-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-11-employment-accessibility-graph-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-11-employment-accessibility-graph-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-11-employment-accessibility-graph-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Workplace accessibility profiles | EXTEND | `EmployerAccessibility*` |
| 2 | Candidate-controlled disclosure gates | EXTEND | `MAPABLE_JOBS_PARTICIPATION_*` |
| 3 | Job ↔ access ↔ transport compatibility | NEW/EXTEND | `JobMatchExplanation` |
| 4 | Adjustment request workflow | EXTEND | `AdjustmentRequest pattern` |
| 5 | Interview accessibility planning | NEW | `vertical slice` |
| 6 | Placement sustainability signals | NEW | `retention KPIs` |
| 7 | Employer access improvement loop | NEW | `feeds E01` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Candidates report disclosure pressure in co-design | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Apply flow with employer blind to disability fields | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
