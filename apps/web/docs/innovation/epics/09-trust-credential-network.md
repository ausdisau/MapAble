# Epic 09 — Trust & Credential Network

> **Azure DevOps Epic key:** `mapable-epic-09-trust-credential-network`  
> **Priority:** P0 | **Horizon:** Foundation Wave  
> **Current claim state:** Implemented, not independently verified

---

## 1. Epic title

Trust & Credential Network

## 2. Epic ID / proposed slug

`mapable-epic-09-trust-credential-network`

## 3. Strategic outcome

Shared credential infrastructure for workers, providers, drivers, vehicles, assessors, employers, organisations, training.

## 4. Participant outcome

Confidence that people and vehicles meeting my trip/care have valid, verified credentials — expired never treated as OK.

## 5. Problem statement

Credential checks scattered across verticals with inconsistent expiry handling.

## 6. Scope

Source, issuer, evidence, issue/expiry, verification, suspension, supersession, review, renewal reminders, exception workflow.

## 7. Explicit non-goals

Silent approval on expiry; vertical-specific credential silos.

## 8. User groups

Providers, workers, drivers, assessors, admins, participants (indirect trust).

## 9. Example user journeys

1. Driver credential expires → blocked from new assignments until renewal or documented exception.
2. Assessor credential verified before E06 assignment.
3. Provider views renewal reminder 30 days before expiry.

## 10. Functional capabilities

- Unified credential registry and lifecycle
- Fail-closed expiry checks
- Exception workflow with human approval
- Renewal reminders via notifications

## 11. Shared Core dependencies

Credential, Worker, Provider, Verification, Document, AuditEvent, Notification.

## 12. Cross-Epic dependencies

Enables E06, E15; gates Care/Transport assignment.

## 13. Data entities

Credential records, verification status, exception approvals.

## 14. APIs/events required

/api/credentials/*; events: CredentialExpired, CredentialVerified, ExceptionApproved.

## 15. Permission model

Issuer/admin verify; worker read own; verticals check via API.

## 16. Consent requirements

Credential evidence may contain personal docs; access minimised.

## 17. Human approval gates

All exceptions to expired credential rules.

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

Document storage encrypted; limited retention.

## 20. Safeguarding requirements

WWCC and screening types prioritised; no bypass without exception audit.

## 21. AI use, if any

None for verification decisions.

## 22. AI prohibited decisions

Auto-approve expired; infer credential from profile photo.

## 23. AI eval requirements

N/A

## 24. Audit requirements

Every check and exception logged.

## 25. Observability requirements

Expiring credentials dashboard; exception rate.

## 26. Complaints/correction path

Credential dispute process.

## 27. Feature flags

Credential check flags per vertical.

## 28. Failure and fallback behaviour

Manual credential upload review queue.

## 29. Security requirements

Tamper-evident evidence storage; RBAC.

## 30. Definition of Ready

G0–G2; credential types enumerated.

## 31. Definition of Done

Expiry block demonstrated in transport/care pilot.

## 32. MVP acceptance criteria

Driver + assessor credential types with expiry gate.

## 33. Pilot acceptance criteria

100% expired blocked unless approved exception.

## 34. Scale acceptance criteria

Employer and vehicle types full lifecycle.

## 35. KPIs

Credential-expiry exceptions documented 100%.

## 36. Risks

R05 silent expiry approval.

## 37. Mitigations

Fail-closed; exception workflow.

## 38. Dependencies

Shared Core; parallel with E01.

## 39. Recommended owner/team

Trust Platform Team

## 40. Delivery horizon

Foundation Wave

## 41. Current claim state

**Implemented, not independently verified**

## 42. Evidence required before claim-state promotion

Worker/provider credential models exist. Promote after G4 proves expiry never silently approves.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-09-trust-credential-network-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-09-trust-credential-network-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-09-trust-credential-network-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-09-trust-credential-network-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-09-trust-credential-network-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-09-trust-credential-network-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-09-trust-credential-network-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Credential registry + lifecycle | EXTEND | `Worker/Provider credential models` |
| 2 | Expiry + suspension (never silent approve) | NEW/EXTEND | `deterministic gates` |
| 3 | Issuer verification + evidence | EXTEND | `QMS, Stripe Identity gated` |
| 4 | Renewal reminders + exceptions | NEW | `Notification` |
| 5 | Vehicle/driver/assessor types | EXTEND | `transport, accreditation` |
| 6 | Credential API for verticals | EXTEND | `shared Core` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Incidents/near-miss from expired credentials documented | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Expired credential blocks assignment in demo | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
