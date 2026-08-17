# Epic 01 — MapAble Access Graph

> **Azure DevOps Epic key:** `mapable-epic-01-access-graph`  
> **Priority:** P0 | **Horizon:** Foundation Wave  
> **Current claim state:** In development

---

## 1. Epic title

MapAble Access Graph

## 2. Epic ID / proposed slug

`mapable-epic-01-access-graph`

## 3. Strategic outcome

Create the canonical evidence-backed accessibility data graph used across MapAble.

## 4. Participant outcome

Reliable, correctable accessibility information with transparent provenance — not vague labels or unverified guesses.

## 5. Problem statement

Accessibility data is fragmented, stale, or missing provenance. Participants cannot distinguish measured, reported, inferred, or expired claims.

## 6. Scope

Places, entrances, paths, doorways, thresholds, ramps, gradients, surfaces, stairs, lifts, toilets/Changing Places, parking, drop-off, kerb ramps, crossings, public transport access, sensory, hearing augmentation, lighting, acoustics, counters, seating, workplaces, vehicles, providers, accessibility services — each with source, timestamp, evidence type, verification state, confidence, expiry, dispute history.

## 7. Explicit non-goals

Universal accessibility score; legal compliance certification; passport exposure in public graph; AI-only verification; second place SoT; national live registry claim without G5.

## 8. User groups

Participants, community reporters, venue operators, assessors, transport operators, planners, admins.

## 9. Example user journeys

1. Community member reports broken ramp with photo; enters as community_reported pending verification.
2. Assessor publishes measured doorway after accreditation with assessor_measured provenance and expiry.
3. Participant disputes lift status; correction updates graph with audit trail.

## 10. Functional capabilities

- Ingest and store access assertions with full provenance taxonomy
- Distinguish community_reported, organisation_supplied, assessor_measured, sensor_observed, AI inferred, independently_verified, unknown, expired
- Freshness/expiry engine with automated stale marking
- Dispute/correction workflow with participant notification
- Internal read API with provenance in every response

## 11. Shared Core dependencies

Place, AccessFeature, AccessObservation, Verification, AuditEvent, Document, EvidenceItem, FeatureFlag.

## 12. Cross-Epic dependencies

Upstream: Shared Core. Downstream: E02–E07, E11–E14. Blocks flywheel.

## 13. Data entities

AccessPlace, AccessPlaceFeature, AccessObservationRecord, AccessEvidenceEnvelopeRecord, AccessCapabilityRecord, AccessPlaceReview.

## 14. APIs/events required

GET/POST /api/access/*; events: ObservationCreated, VerificationStateChanged, EvidenceExpired, DisputeOpened.

## 15. Permission model

Public: published capabilities with provenance. Community: submit observations. Assessor/org: scoped corrections. Admin: moderation.

## 16. Consent requirements

Submission terms; no PII in public payloads; passport never in place records.

## 17. Human approval gates

Verified status promotion; bulk imports; organisation corrections to verified facts.

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

Minimum necessary public fields; pseudonymous reporters; photo retention policy.

## 20. Safeguarding requirements

Hazard reports to moderation queue; no auto-block without review option.

## 21. AI use, if any

Optional tagging assist — outputs always AI_INFERRED — UNVERIFIED until verification.

## 22. AI prohibited decisions

Awarding accreditation; marking independently_verified; inferring disability.

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

Append-only provenance; AuditEvent on all state changes.

## 25. Observability requirements

Freshness, coverage, dispute queue, false report rate dashboards.

## 26. Complaints/correction path

Dispute workflow; engagement complaints for sustained issues.

## 27. Feature flags

MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED; access intelligence flags default off until G4.

## 28. Failure and fallback behaviour

Unknown ≠ inaccessible; manual place browse; community report path.

## 29. Security requirements

Rate limits; upload scanning; RBAC on verify.

## 30. Definition of Ready

G0–G2; ontology draft; no second place SoT.

## 31. Definition of Done

G3–G5; tests; manual AT on browse/report.

## 32. MVP acceptance criteria

100 pilot places, ≥3 feature types each, provenance on every assertion.

## 33. Pilot acceptance criteria

500 places; 70% freshness SLA; 14-day correction SLA.

## 34. Scale acceptance criteria

Multi-region; partner ingestion; G6 monitoring.

## 35. KPIs

Feature-level evidence %; freshness; verified observations; corrections; false report rate.

## 36. Risks

R01 inferred as fact; R08 duplicate SoT.

## 37. Mitigations

Provenance UI; architecture review; claim honesty.

## 38. Dependencies

E06 verified pipeline; E09 assessor identity.

## 39. Recommended owner/team

Access Platform Team

## 40. Delivery horizon

Foundation Wave

## 41. Current claim state

**In development**

G3 technical proof (observation→store→read with provenance + freshness) landed behind `MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED` + `MAPABLE_ACCESS_GRAPH_ENABLED`. See [E01_ACCESS_GRAPH_G3_STATUS.md](../E01_ACCESS_GRAPH_G3_STATUS.md). Not Verified live; no production claim.

## 42. Evidence required before claim-state promotion

Promote to **Implemented, not independently verified** after G4 pilot with provenance on all pilot assertions and dispute path exercised. Promote to **Verified live** only after independent verification of regional coverage claims.

Engineering evidence already available for G3:

- Unit tests: `tests/access/access-graph-provenance.test.ts`, `tests/access/access-graph-observation-service.test.ts`
- APIs: `/api/access-infrastructure/observations`, `/api/access-infrastructure/graph/places/[placeId]`
- Guard: AI-inferred cannot be stored as independently verified

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-01-access-graph-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-01-access-graph-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-01-access-graph-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-01-access-graph-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-01-access-graph-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-01-access-graph-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-01-access-graph-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Canonical accessibility taxonomy | EXTEND | `docs/access-infrastructure/ONTOLOGY.md` |
| 2 | Place and feature schema | EXTEND | `AccessPlace, AccessPlaceFeature` |
| 3 | Evidence provenance system | EXTEND | `AccessObservationRecord` |
| 4 | Observation workflow | NEW/EXTEND | `lib/access/import, moderation` |
| 5 | Verification workflow | NEW | `E06 integration` |
| 6 | Freshness and expiry engine | NEW | `—` |
| 7 | Correction/dispute workflow | EXTEND | `AccessPlaceReview` |
| 8 | Access Graph read API (internal) | NEW | `docs/developer-api/` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | ≥3 sources document fragmented/stale access data pain | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | End-to-end observation→store→read with provenance labels | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
