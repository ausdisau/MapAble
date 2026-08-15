# Epic 12 — Circular Assistive Technology Network

> **Azure DevOps Epic key:** `mapable-epic-12-circular-assistive-technology`  
> **Priority:** P3 | **Horizon:** R&D Wave  
> **Current claim state:** Exploratory

---

## 1. Epic title

Circular Assistive Technology Network

## 2. Epic ID / proposed slug

`mapable-epic-12-circular-assistive-technology`

## 3. Strategic outcome

Trusted network for purchase, rental, reuse, refurbishment, trials, delivery, servicing, recalls.

## 4. Participant outcome

Find equipment options with honest safety and funding boundaries — listing ≠ prescribed or fundable.

## 5. Problem statement

AT access is expensive; reuse/recall information fragmented.

## 6. Scope

Equipment Passport: model, serial, ownership, condition, service history, warranty, recalls, compatibility, accessories.

## 7. Explicit non-goals

Marketplace listing implies clinical suitability; auto-funding; prescription verification without authority.

## 8. User groups

Participants, providers, AT suppliers, technicians.

## 9. Example user journeys

1. Participant registers equipment in passport with condition notes.
2. Recall notice matched to serial; owner notified.
3. Trial listing browsed with explicit non-clinical disclaimer.

## 10. Functional capabilities

- Equipment Passport schema
- Recall/warranty tracking
- Compatibility metadata
- Clinical suitability guardrails in UI copy

## 11. Shared Core dependencies

AtEquipmentAsset, Document, Credential, Notification, AuditEvent.

## 12. Cross-Epic dependencies

E09 trust for suppliers; future E07 coordination.

## 13. Data entities

AtEquipmentAsset, AtEquipmentOutage, listing records (proposed).

## 14. APIs/events required

/api/at/equipment/* (proposed); recall webhooks.

## 15. Permission model

Owner edits passport; suppliers verified via E09.

## 16. Consent requirements

Serial numbers sensitive; share controlled.

## 17. Human approval gates

Supplier listing publication; recall broadcast.

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

Ownership data not public.

## 20. Safeguarding requirements

Recall notifications mandatory; no delay.

## 21. AI use, if any

None for clinical suitability.

## 22. AI prohibited decisions

Infer prescription; claim NDIS fundability from listing.

## 23. AI eval requirements

N/A

## 24. Audit requirements

Ownership transfer; recall acknowledgment.

## 25. Observability requirements

Recall delivery rate; listing disclaimer impressions.

## 26. Complaints/correction path

Faulty equipment incident path.

## 27. Feature flags

AT continuity flags; marketplace flag proposed off.

## 28. Failure and fallback behaviour

External AT provider referral; manual recall register check.

## 29. Security requirements

Verified suppliers only for listings.

## 30. Definition of Ready

G0–G2; clinical boundary copy approved.

## 31. Definition of Done

Equipment Passport + recall match demo.

## 32. MVP acceptance criteria

Passport CRUD + one recall scenario.

## 33. Pilot acceptance criteria

5 equipment types; zero clinical claims in UI.

## 34. Scale acceptance criteria

Regional supplier network.

## 35. KPIs

Recall notification success.

## 36. Risks

R12 clinical overclaim from marketplace.

## 37. Mitigations

Explicit non-claims; no auto-funding.

## 38. Dependencies

E09 supplier credentials.

## 39. Recommended owner/team

AT Programme Team

## 40. Delivery horizon

R&D Wave

## 41. Current claim state

**Exploratory**

## 42. Evidence required before claim-state promotion

AtEquipmentAsset continuity only; no marketplace. Promote after G3 Equipment Passport without clinical/funding overclaims.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-12-circular-assistive-technology-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-12-circular-assistive-technology-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-12-circular-assistive-technology-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-12-circular-assistive-technology-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-12-circular-assistive-technology-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-12-circular-assistive-technology-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-12-circular-assistive-technology-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Equipment Passport schema | EXTEND | `AtEquipmentAsset` |
| 2 | Trial/rental/reuse listing | NEW | `exploratory only` |
| 3 | Recall + warranty tracking | NEW | `safety` |
| 4 | Compatibility + accessories | NEW | `—` |
| 5 | Clinical suitability guardrails | NEW | `explicit non-claims` |
| 6 | Servicing + collection logistics | DEFER | `operational complexity` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Participants report AT cost/access pain | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Passport + recall notification without marketplace | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
