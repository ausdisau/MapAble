# Epic 14 — MapAble Access Observatory

> **Azure DevOps Epic key:** `mapable-epic-14-access-observatory`  
> **Priority:** P2 | **Horizon:** Platform Commercialisation Wave  
> **Current claim state:** Proposed

---

## 1. Epic title

MapAble Access Observatory

## 2. Epic ID / proposed slug

`mapable-epic-14-access-observatory`

## 3. Strategic outcome

Aggregate accessibility intelligence for planners and policy — never identifiable participant journeys.

## 4. Participant outcome

Benefit from systemic fixes driven by evidence — not surveillance of my trips.

## 5. Problem statement

Councils lack gap analysis; no privacy-safe aggregate view.

## 6. Scope

Gap analysis, route barriers, inaccessible precincts, infrastructure opportunities, employment clusters, transport gaps, thin markets, data coverage.

## 7. Explicit non-goals

Identifiable journey export; participant tracking; re-identification from aggregates.

## 8. User groups

Councils, planners, researchers, transport operators, community orgs.

## 9. Example user journeys

1. Council views precinct barrier heatmap (k-anonymised).
2. Researcher exports aggregate coverage report with ethics approval gate.
3. Transport operator sees interchange gap index — not individual routes.

## 10. Functional capabilities

- Privacy-preserving aggregation (k-anonymity minimum)
- Gap and coverage dashboards
- Ethics-approved research export workflow
- No journey-level PII

## 11. Shared Core dependencies

Place, AccessObservation, Analytics aggregates, AuditEvent.

## 12. Cross-Epic dependencies

E01, E03, E11 data; after E13 patterns optional.

## 13. Data entities

Aggregate tables, export approvals, ethics records.

## 14. APIs/events required

Internal /api/observatory/*; export API gated.

## 15. Permission model

Government partner workspace; role-based dashboard access.

## 16. Consent requirements

Aggregates only; opt-in analytics separate from observatory exports.

## 17. Human approval gates

Research exports; new aggregate dimensions (re-identification review).

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

k-anonymity ≥ k; differential privacy review for sensitive cuts.

## 20. Safeguarding requirements

No individual targeting from observatory data.

## 21. AI use, if any

Aggregate trend summarisation only — no individual inference.

## 22. AI prohibited decisions

Individual journey reconstruction; participant profiling.

## 23. AI eval requirements

Re-identification attempt tests.

## 24. Audit requirements

Every export logged with approver.

## 25. Observability requirements

Export volume; re-id test results.

## 26. Complaints/correction path

Privacy complaint if misuse suspected.

## 27. Feature flags

Observatory flags proposed; off by default.

## 28. Failure and fallback behaviour

Manual aggregate reports for partners.

## 29. Security requirements

Partner workspace isolation; export watermarking.

## 30. Definition of Ready

G0–G2; privacy impact assessment complete.

## 31. Definition of Done

Re-id test pass; one council dashboard live.

## 32. MVP acceptance criteria

Coverage map + gap count by LGA.

## 33. Pilot acceptance criteria

2 councils; ethics export for 1 research partner.

## 34. Scale acceptance criteria

National LGA coverage with honesty on sparse regions.

## 35. KPIs

Data coverage; zero re-id incidents.

## 36. Risks

R10 journey re-identification.

## 37. Mitigations

k-anonymity; export gates.

## 38. Dependencies

E01, E03, E11.

## 39. Recommended owner/team

Data & Policy Team

## 40. Delivery horizon

Platform Commercialisation Wave

## 41. Current claim state

**Proposed**

## 42. Evidence required before claim-state promotion

Analytics-research docs exist; privacy-preserving observatory not implemented.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-14-access-observatory-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-14-access-observatory-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-14-access-observatory-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-14-access-observatory-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-14-access-observatory-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-14-access-observatory-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-14-access-observatory-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Privacy-preserving aggregation | NEW/EXTEND | `analytics-research.md` |
| 2 | Gap analysis dashboards | NEW | `councils/planners` |
| 3 | Route barrier heatmaps | NEW | `E01+E03` |
| 4 | Employment cluster analysis | NEW | `E11` |
| 5 | Data coverage metrics | NEW | `KPI alignment` |
| 6 | No identifiable journey exposure | NEW | `privacy hard gate` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Council/planner demand in co-design | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Dashboard with k-anonymised aggregates only | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
