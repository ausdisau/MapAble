# Epic 04 — Access Intelligence Vision

> **Azure DevOps Epic key:** `mapable-epic-04-access-intelligence-vision`  
> **Priority:** P3 | **Horizon:** R&D Wave  
> **Current claim state:** Exploratory

---

## 1. Epic title

Access Intelligence Vision

## 2. Epic ID / proposed slug

`mapable-epic-04-access-intelligence-vision`

## 3. Strategic outcome

Human-supervised computer-vision accessibility evidence assistant.

## 4. Participant outcome

Faster evidence collection with clear labelling that AI suggestions are unverified until confirmed.

## 5. Problem statement

Manual access surveys are slow; communities need assistive capture without AI overclaiming.

## 6. Scope

Entrances, door-width estimates, ramps, steps, kerb ramps, handrails, signage, accessible parking, toilet features, surfaces, hazards — all AI_INFERRED — UNVERIFIED initially.

## 7. Explicit non-goals

CV-only accreditation; compliance certification; auto-publish to verified graph.

## 8. User groups

Community reporters, assessors, moderators, venue operators (corrections).

## 9. Example user journeys

1. Photo uploaded; CV proposes ramp detection → moderation queue.
2. Organisation corrects misidentified entrance.
3. Assessor validates proposal → promoted via E06 workflow.

## 10. Functional capabilities

- CV proposal pipeline with mandatory unverified status
- Human verification queues (community, org, assessor)
- Integration to E01 observation ingestion
- Eval harness for hallucinated feature detection

## 11. Shared Core dependencies

AccessObservation, Document, EvidenceItem, AuditEvent, FeatureFlag.

## 12. Cross-Epic dependencies

Feeds E01; requires E06 for assessor validation path.

## 13. Data entities

AccessObservationRecord with AI provenance; moderation queue items.

## 14. APIs/events required

POST /api/access/vision/propose (internal); events: VisionProposalCreated.

## 15. Permission model

Reporters submit; moderators/assessors verify; no auto-publish.

## 16. Consent requirements

Photo consent at capture; faces/plates blurring policy.

## 17. Human approval gates

Any promotion out of AI_INFERRED status.

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

PII scrubbing on images; retention limits.

## 20. Safeguarding requirements

 Hazard proposals prioritised in queue.

## 21. AI use, if any

Classification and detection proposals only.

## 22. AI prohibited decisions

Accreditation; independently_verified status; compliance claims.

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

Model version on each proposal; verifier identity logged.

## 25. Observability requirements

Proposal→verify latency; false positive rate.

## 26. Complaints/correction path

Incorrect AI tag → dispute path.

## 27. Feature flags

MAPABLE_ACCESS_VISION_ENABLED (proposed, default false).

## 28. Failure and fallback behaviour

Manual observation form without CV.

## 29. Security requirements

Sandboxed inference; no participant passport in CV context.

## 30. Definition of Ready

G0–G2; R&D sandbox approved.

## 31. Definition of Done

Eval suite pass; zero auto-verified CV outputs.

## 32. MVP acceptance criteria

3 feature types detected as proposals only.

## 33. Pilot acceptance criteria

50% assessor confirmation rate on proposals.

## 34. Scale acceptance criteria

Regional rollout with moderation staffing model.

## 35. KPIs

False positive rate; time-to-verify.

## 36. Risks

R01 CV as verified fact.

## 37. Mitigations

Hard UNVERIFIED enum; human gates.

## 38. Dependencies

E01 ingestion; E06 validation.

## 39. Recommended owner/team

AI Platform Team (Access)

## 40. Delivery horizon

R&D Wave

## 41. Current claim state

**Exploratory**

## 42. Evidence required before claim-state promotion

Explicitly deferred in docs/ai-platform/CURRENT_STATE.md. Promote to In development only after G3 CV pipeline with mandatory UNVERIFIED labelling.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-04-access-intelligence-vision-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-04-access-intelligence-vision-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-04-access-intelligence-vision-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-04-access-intelligence-vision-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-04-access-intelligence-vision-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-04-access-intelligence-vision-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-04-access-intelligence-vision-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | CV evidence proposal pipeline | NEW | `deferred in CURRENT_STATE.md` |
| 2 | AI INFERRED — UNVERIFIED labelling | NEW | `provenance enum` |
| 3 | Human verification queue | EXTEND | `moderation` |
| 4 | Community confirmation | EXTEND | `AccessPlaceReview` |
| 5 | Organisation correction | EXTEND | `venue admin` |
| 6 | Assessor validation | EXTEND | `E06` |
| 7 | Vision eval harness | NEW | `pnpm ai:evals` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Evidence that manual capture is bottleneck | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Photo→proposal→queue→reject/accept without auto-verify | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
