# Epic 15 — MapAble Academy + Capability Passport

> **Azure DevOps Epic key:** `mapable-epic-15-academy-capability-passport`  
> **Priority:** P2 | **Horizon:** Participation Wave  
> **Current claim state:** Exploratory

---

## 1. Epic title

MapAble Academy + Capability Passport

## 2. Epic ID / proposed slug

`mapable-epic-15-academy-capability-passport`

## 3. Strategic outcome

Shared learning and capability layer — course completion ≠ professional competence where supervised practice required.

## 4. Participant outcome

Workers and drivers with verified capabilities, not just certificates.

## 5. Problem statement

Training tracked inconsistently; course badges mistaken for competency.

## 6. Scope

Courses, competency assessment, evidence, expiry, refresher, role requirements, capability passport, credential integration.

## 7. Explicit non-goals

Auto-representing course completion as registration/qualification; unsupervised competency claims.

## 8. User groups

Workers, drivers, assessors, providers, employers, venue staff, MapAble staff.

## 9. Example user journeys

1. Worker completes course; capability passport shows 'training complete' not 'competent' until assessment.
2. Assessor sign-off adds competency credential via E09.
3. Refresher due → reminder → assignment block if role requires.

## 10. Functional capabilities

- Course catalogue and competency proposals
- Competency assessment workflow separate from course
- Capability Passport linked to E09 credentials
- Expiry/refresher integrated with assignment gates

## 11. Shared Core dependencies

Credential, Document, EvidenceItem, Worker, Notification, AuditEvent.

## 12. Cross-Epic dependencies

E09 credentials; Starting Work; Care/Transport assignment gates.

## 13. Data entities

AcademyCompetencyProposal, course records, assessment evidence, capability passport.

## 14. APIs/events required

/api/academy/*; credential link events.

## 15. Permission model

Learner read own; assessor sign-off; provider assign training.

## 16. Consent requirements

Assessment evidence may include video; explicit consent.

## 17. Human approval gates

Competency sign-off; role requirement changes.

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

Assessment media access controlled.

## 20. Safeguarding requirements

Mandatory safeguarding courses for care roles; verified before assignment.

## 21. AI use, if any

Course content summarisation only; not competency decisions.

## 22. AI prohibited decisions

Auto-competency from course completion; replacing supervised assessment.

## 23. AI eval requirements

N/A unless AI grading proposed — then prohibited without human review.

## 24. Audit requirements

Course vs competency state transitions logged.

## 25. Observability requirements

Refresher compliance; assignment block rate.

## 26. Complaints/correction path

Assessment dispute path.

## 27. Feature flags

Academy flags proposed.

## 28. Failure and fallback behaviour

External RTO credentials uploaded manually to E09.

## 29. Security requirements

Assessor identity verified.

## 30. Definition of Ready

G0–G2; role competency matrix with providers.

## 31. Definition of Done

Course + separate competency sign-off demonstrated.

## 32. MVP acceptance criteria

One course + one competency assessment path.

## 33. Pilot acceptance criteria

Starting Work worker cohort; blocks on missing competency.

## 34. Scale acceptance criteria

Full role matrix for care/transport/drivers/assessors.

## 35. KPIs

Competency vs course distinction audit 100%.

## 36. Risks

R11 course as competence.

## 37. Mitigations

Separate states; explicit UI labels.

## 38. Dependencies

E09.

## 39. Recommended owner/team

Workforce Development Team

## 40. Delivery horizon

Participation Wave

## 41. Current claim state

**Exploratory**

## 42. Evidence required before claim-state promotion

AcademyCompetencyProposal scaffold only. Starting Work explicitly states academy evidence ≠ competency.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-15-academy-capability-passport-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-15-academy-capability-passport-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-15-academy-capability-passport-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-15-academy-capability-passport-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-15-academy-capability-passport-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-15-academy-capability-passport-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-15-academy-capability-passport-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Course + competency catalogue | EXTEND | `AcademyCompetencyProposal` |
| 2 | Competency assessment workflow | NEW | `course ≠ competence` |
| 3 | Capability Passport | NEW | `E09 integration` |
| 4 | Expiry + refresher training | NEW | `credential lifecycle` |
| 5 | Evidence capture for assessments | EXTEND | `document management` |
| 6 | Worker readiness integration | EXTEND | `Starting Work pilot` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Providers report training/competency confusion | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Course complete without competency badge until assessor sign-off | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
