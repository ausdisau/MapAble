# Epic 05 — Accessibility Digital Twins

> **Azure DevOps Epic key:** `mapable-epic-05-accessibility-digital-twins`  
> **Priority:** P3 | **Horizon:** R&D Wave  
> **Current claim state:** In development

---

## 1. Epic title

Accessibility Digital Twins

## 2. Epic ID / proposed slug

`mapable-epic-05-accessibility-digital-twins`

## 3. Strategic outcome

Structured spatial models for venues, stations, workplaces, campuses, hospitals, precincts, events.

## 4. Participant outcome

Preview venue access and plan journeys when sufficient spatial evidence exists — not before.

## 5. Problem statement

Indoor and precinct access is invisible in outdoor-only maps.

## 6. Scope

Spatial models linked to evidence; publication workflow; future indoor nav, evacuation support, passport compatibility preview.

## 7. Explicit non-goals

Production indoor nav without evidence; AR/VR without G3 proof; duplicate place SoT.

## 8. User groups

Venue operators, assessors, participants (preview), planners.

## 9. Example user journeys

1. Assessor uploads floor plan evidence → twin draft.
2. Participant previews entrance-to-room path with uncertainty.
3. Venue plans remediation from twin gap analysis.

## 10. Functional capabilities

- Evidence-backed spatial schema
- Twin publication workflow with review
- Passport compatibility preview (deferred until E02+E01 ready)
- Link to indoor routing when evidence sufficient

## 11. Shared Core dependencies

Place, AccessFeature, Document, EvidenceItem.

## 12. Cross-Epic dependencies

E01 spatial entities; E03 indoor stitch deferred; E06 assessments.

## 13. Data entities

AccessFloorPlan, IndoorAccessibilityIncident, spatial graph nodes/edges.

## 14. APIs/events required

Internal twin CRUD; partner preview API (deferred).

## 15. Permission model

Venue org admins edit own twins; public read published only.

## 16. Consent requirements

Floor plans may contain sensitive layout; access controlled.

## 17. Human approval gates

Public twin publication.

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

No participant tracking in twins; aggregate analytics only.

## 20. Safeguarding requirements

Evacuation info advisory only; human emergency services.

## 21. AI use, if any

None in R&D phase except optional layout assist (UNVERIFIED).

## 22. AI prohibited decisions

Evacuation routing without verified exits; compliance claims.

## 23. AI eval requirements

N/A until AI assist introduced.

## 24. Audit requirements

Twin version history; publisher identity.

## 25. Observability requirements

Twin coverage; evidence linkage completeness.

## 26. Complaints/correction path

Venue correction request path.

## 27. Feature flags

Indoor accessibility flags; default off.

## 28. Failure and fallback behaviour

Outdoor-only routing; venue static PDF access statement.

## 29. Security requirements

Authenticated venue admin; watermark draft twins.

## 30. Definition of Ready

G0–G2; spatial evidence standard defined.

## 31. Definition of Done

One venue twin with linked observations.

## 32. MVP acceptance criteria

1 campus twin pilot with publication workflow.

## 33. Pilot acceptance criteria

3 venues; passport preview deferred flag off.

## 34. Scale acceptance criteria

Evidence thresholds per venue type.

## 35. KPIs

Twins with ≥80% evidence-linked nodes.

## 36. Risks

R16 R&D promoted prematurely.

## 37. Mitigations

R&D wave; DEFER features.

## 38. Dependencies

E01, E06 evidence.

## 39. Recommended owner/team

Access R&D Team

## 40. Delivery horizon

R&D Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

AccessFloorPlan and indoor docs partial. Remains R&D until spatial evidence pipeline (E01/E06) supports twins.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-05-accessibility-digital-twins-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-05-accessibility-digital-twins-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-05-accessibility-digital-twins-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-05-accessibility-digital-twins-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-05-accessibility-digital-twins-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-05-accessibility-digital-twins-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-05-accessibility-digital-twins-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Spatial venue model schema | EXTEND | `AccessFloorPlan` |
| 2 | Evidence-backed twin ingestion | NEW | `spatial evidence required` |
| 3 | Passport compatibility preview | DEFER | `E02+E01` |
| 4 | Evacuation planning support | PROPOSED | `no runtime` |
| 5 | AR/VR preview interface | EXPLORATORY | `—` |
| 6 | Twin publication workflow | EXTEND | `indoor-accessibility/publication-workflow.md` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Indoor access pain documented for pilot venues | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Twin ingest→publish→read with evidence links | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
