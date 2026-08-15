# Epic 06 — MapAble Accreditation OS

> **Azure DevOps Epic key:** `mapable-epic-06-accreditation-os`  
> **Priority:** P0 | **Horizon:** Foundation Wave  
> **Current claim state:** Implemented, not independently verified

---

## 1. Epic title

MapAble Accreditation OS

## 2. Epic ID / proposed slug

`mapable-epic-06-accreditation-os`

## 3. Strategic outcome

Operational voluntary accessibility verification — not legal compliance certification.

## 4. Participant outcome

Trustworthy venue accessibility claims backed by assessor evidence and appeals.

## 5. Problem statement

Accreditation methodology exists in docs but operational end-to-end workflow is incomplete.

## 6. Scope

Venue select → assessor assign → assessment → measurements → photos → scoring → human review → remediation → decision → publish to graph → expiry → reassessment → appeals.

## 7. Explicit non-goals

Legal compliance certification; auto-accreditation; AI scoring without human review.

## 8. User groups

Assessors, venue operators, participants (read published facts), admins.

## 9. Example user journeys

1. Assessor completes site visit with measurements → human review → approved facts to graph.
2. Venue remediation tracked → reassessment scheduled.
3. Participant appeals score presentation; correction path opens.

## 10. Functional capabilities

- Assessment versioning and evidence provenance
- Human review gate before graph publication
- Remediation tracking and expiry/reassessment
- Appeals with audit history

## 11. Shared Core dependencies

AccreditationAssessment, Verification, Credential, Document, EvidenceItem, AuditEvent.

## 12. Cross-Epic dependencies

Requires E01, E09. Enables E13 verified API.

## 13. Data entities

AccessAccreditation*, AccessibilityAccreditationCase, assessor assignments.

## 14. APIs/events required

/api/access/accreditation/*; events: AssessmentCompleted, FactsPublished, AccreditationExpired.

## 15. Permission model

Assessors: assigned venues. Reviewers: approve publication. Venues: read own remediation.

## 16. Consent requirements

Venue operator consent for publication; participant data not required for venue assessment.

## 17. Human approval gates

All publication to graph; accreditation decision; appeals outcome.

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

Assessment photos access-controlled; public summary minimum necessary.

## 20. Safeguarding requirements

No participant safety scoring; voluntary verification framing.

## 21. AI use, if any

Draft remediation text suggestions only; human approves.

## 22. AI prohibited decisions

Auto-accreditation decision; compliance certification language.

## 23. AI eval requirements

Hallucinated measurement; unsupported compliance claim.

## 24. Audit requirements

Full assessment version chain.

## 25. Observability requirements

Time-to-accredit; appeal rate; expiry compliance.

## 26. Complaints/correction path

Appeals workflow; engagement complaints.

## 27. Feature flags

Accreditation flags; MAPABLE_QUALITY_QMS_ENABLED related.

## 28. Failure and fallback behaviour

Manual assessor workflow outside system for edge cases.

## 29. Security requirements

Assessor credential verification via E09.

## 30. Definition of Ready

G0–G2; assessor credential types defined.

## 31. Definition of Done

One full cycle to graph with appeal tested.

## 32. MVP acceptance criteria

Single venue assessment → publish → expiry.

## 33. Pilot acceptance criteria

10 venues; 100% human review before publish.

## 34. Scale acceptance criteria

Assessor network onboarding via E09.

## 35. KPIs

Verified observations published; appeal resolution time.

## 36. Risks

Auto-accreditation pressure; compliance mislabeling.

## 37. Mitigations

Human review gate; voluntary verification copy.

## 38. Dependencies

E01 graph; E09 assessor credentials.

## 39. Recommended owner/team

Access Platform Team

## 40. Delivery horizon

Foundation Wave

## 41. Current claim state

**Implemented, not independently verified**

## 42. Evidence required before claim-state promotion

AccessAccreditation* models and lib/access/accreditation* exist. Promote after G4 full assessor workflow publishes to graph with appeals.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-06-accreditation-os-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-06-accreditation-os-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-06-accreditation-os-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-06-accreditation-os-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-06-accreditation-os-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-06-accreditation-os-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-06-accreditation-os-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Assessment workflow engine | EXTEND | `lib/access/accreditation*` |
| 2 | Assessor assignment + identity | EXTEND | `E09 credentials` |
| 3 | Measurement + evidence capture | EXTEND | `evidence envelopes` |
| 4 | Scoring + human review | EXTEND | `no auto-decision flags` |
| 5 | Remediation tracking | NEW/EXTEND | `—` |
| 6 | Publish approved facts to graph | EXTEND | `E01` |
| 7 | Expiry + reassessment | NEW | `freshness engine` |
| 8 | Appeals/corrections | EXTEND | `engagement patterns` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Venue operators request operational accreditation tool | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Assessment→review→graph publish with provenance | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
