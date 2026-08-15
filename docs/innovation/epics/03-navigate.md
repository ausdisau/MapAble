# Epic 03 — MapAble Navigate

> **Azure DevOps Epic key:** `mapable-epic-03-navigate`  
> **Priority:** P1 | **Horizon:** Experience Wave  
> **Current claim state:** In development

---

## 1. Epic title

MapAble Navigate

## 2. Epic ID / proposed slug

`mapable-epic-03-navigate`

## 3. Strategic outcome

Accessible routing optimising suitability, not shortest time alone.

## 4. Participant outcome

Journey options that respect my access requirements with honest uncertainty about evidence quality.

## 5. Problem statement

Maps optimise distance/time and hide stairs, gradients, surfaces, lift outages, and sensory intensity.

## 6. Scope

Gradients, surfaces, narrow paths, stairs, kerb ramps, crossings, lifts/outages, toilets, rest, shade, lighting, sensory intensity, PT interchange, recharge, temporary barriers, construction. Uncertainty and freshness visible.

## 7. Explicit non-goals

Presenting inferred access as verified; guaranteed accessible arrival; indoor routing at scale until E05 evidence.

## 8. User groups

Participants, support coordinators, drivers (read-only route context).

## 9. Example user journeys

1. Power wheelchair user requests route avoiding stairs and steep gradients; alternatives shown with evidence age.
2. Lift outage reported; route recalculates with notification.
3. Participant adds rest stop; route adjusts without penalty UX.

## 10. Functional capabilities

- Suitability-weighted routing using Access Graph + Passport
- Segment-level provenance and freshness display
- Rest/toilet/recharge waypoint insertion
- Temporary barrier ingestion from community/graph
- Non-AI manual step-by-step directions fallback

## 11. Shared Core dependencies

Place, AccessFeature, AccessObservation, RouteEstimate, Trip, AccessJourneyRecord, ParticipantProfile.

## 12. Cross-Epic dependencies

Requires E01, E02. Enables E07, E11 commute, E14 heatmaps.

## 13. Data entities

AccessJourneyRecord, RouteEstimate, TransportTrip (reuse), AccessCompatibility.

## 14. APIs/events required

/api/access/navigate/route; events: RouteComputed, BarrierReported, LiftOutageDetected.

## 15. Permission model

Participant routes own journeys; operators see assigned trip segments only.

## 16. Consent requirements

Passport scopes for routing; no sharing route history to employers without consent.

## 17. Human approval gates

Publishing default routes for public landmarks.

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

Journey history participant-controlled; aggregate only for Observatory.

## 20. Safeguarding requirements

Night routing warnings; escalation to human support.

## 21. AI use, if any

Optional natural-language route explanation — must cite evidence states.

## 22. AI prohibited decisions

Claiming verified access without provenance; hiding uncertainty.

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

Route requests logged; barrier reports auditable.

## 25. Observability requirements

Route completion rate; required-segment failure rate.

## 26. Complaints/correction path

Report incorrect segment; feeds E01 dispute.

## 27. Feature flags

New MAPABLE_NAVIGATE_ENABLED (proposed); transport routing flags.

## 28. Failure and fallback behaviour

Step-by-step list; static map with flagged segments; human phone/chat escalation via E08.

## 29. Security requirements

Rate limit route API; no precise home geo in logs without consent.

## 30. Definition of Ready

G0–G2; E01 pilot data available.

## 31. Definition of Done

Manual AT on route UI; uncertainty labels verified.

## 32. MVP acceptance criteria

50 pilot routes with provenance on every segment.

## 33. Pilot acceptance criteria

70% journey completion for required segments.

## 34. Scale acceptance criteria

Multi-city graph coverage thresholds.

## 35. KPIs

Accessible-route completion; false barrier reports.

## 36. Risks

R01 inferred as verified on routes.

## 37. Mitigations

Segment provenance badges; stale warnings.

## 38. Dependencies

E01, E02 required.

## 39. Recommended owner/team

Access Platform Team

## 40. Delivery horizon

Experience Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

Transport routing exists (mock/OSRM). Promote after G4 shows suitability routing with uncertainty UI on pilot journeys.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-03-navigate-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-03-navigate-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-03-navigate-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-03-navigate-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-03-navigate-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-03-navigate-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-03-navigate-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Suitability routing engine | NEW/EXTEND | `lib/transport-routing/*` |
| 2 | Evidence-aware route segments | EXTEND | `AccessJourneyRecord` |
| 3 | Uncertainty + freshness UI | NEW | `provenance patterns` |
| 4 | Rest/toilet/recharge waypoints | NEW | `graph features` |
| 5 | Temporary barrier ingestion | NEW/EXTEND | `community reports` |
| 6 | Indoor/outdoor route stitching | DEFER | `lib/access/indoor/*` |
| 7 | Navigate participant UI | NEW | `WCAG 2.2 AA` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Pilot data shows time-only routing failures for wheelchair users | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Route with labelled uncertain segments end-to-end | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
