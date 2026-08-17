# Epic 02 — Personal Access Passport

> **Azure DevOps Epic key:** `mapable-epic-02-personal-access-passport`  
> **Priority:** P0 | **Horizon:** Foundation Wave  
> **Current claim state:** Implemented, not independently verified

---

## 1. Epic title

Personal Access Passport

## 2. Epic ID / proposed slug

`mapable-epic-02-personal-access-passport`

## 3. Strategic outcome

Participant-controlled reusable access-needs profile without universal disability disclosure.

## 4. Participant outcome

Control sharing with venues, workers, drivers, providers, employers, assessors, AI, emergency, analytics — with receipts and revocation.

## 5. Problem statement

People repeat access needs or over-disclose diagnosis. Providers accumulate unnecessary sensitive data.

## 6. Scope

Wheelchair dimensions, step-free, doorways, transfer, AAC, sensory, support person, toilet, assistance animal, vehicle, fatigue/rest. Purpose-bound consent, disclosure receipt, expiry, revocation, access log, participant review.

## 7. Explicit non-goals

Universal disability record; diagnosis for matching; provider-owned passport; automatic employer disclosure.

## 8. User groups

Participants, delegates, workers, drivers, employers (scoped), assessors, AI (scoped).

## 9. Example user journeys

1. Share doorway minimum with driver for one trip; receive disclosure receipt.
2. Revoke employer access after interview; caches invalidated.
3. Delegate blocked from AI sharing without grant.

## 10. Functional capabilities

- CRUD access requirements on functional ontology (not diagnosis)
- Recipient-type sharing matrix with purpose and expiry
- Disclosure receipts and participant-visible access log
- Revocation with sub-60-second enforcement target
- Compatibility projection against Access Graph capabilities

## 11. Shared Core dependencies

ParticipantProfile, AccessPassport, ConsentRecord, DataPurpose, DisclosureReceipt, DelegateGrant, AuditEvent.

## 12. Cross-Epic dependencies

Soft: E01. Enables E03, E07, E11.

## 13. Data entities

AccessPassport, AccessRequirementRecord, ConsentRecord, ParticipantAccessReceipt.

## 14. APIs/events required

/api/access-infrastructure/passport; /api/consents; events: PassportShared, ConsentRevoked.

## 15. Permission model

Participant owner; delegate per grant; recipients read consented scopes only.

## 16. Consent requirements

Purpose-bound; time-bound; Easy Read summaries for consequential sharing.

## 17. Human approval gates

Emergency scope; analytics opt-in; delegate grants.

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

Minimum necessary; no diagnosis in matching payloads; participant access log.

## 20. Safeguarding requirements

Emergency scope narrow; break-glass audited separately.

## 21. AI use, if any

AI reads scoped requirements only with explicit AI disclosure consent.

## 22. AI prohibited decisions

Inferring diagnosis; employer sharing without scope; retention after revocation.

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

Every passport read logged with purpose and recipient.

## 25. Observability requirements

Revocation latency; unauthorised access alerts (target 0).

## 26. Complaints/correction path

Privacy complaints; participant self-correction with audit.

## 27. Feature flags

MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED; MAPABLE_TRUST_FABRIC_*.

## 28. Failure and fallback behaviour

Per-journey manual requirements; export summary for offline use.

## 29. Security requirements

Encryption at rest; passkey for owner; session timeout.

## 30. Definition of Ready

G0–G2; sharing matrix co-designed.

## 31. Definition of Done

Revocation tested; receipts; G5 participant KPIs.

## 32. MVP acceptance criteria

Create passport; one-trip driver share; revoke; access log.

## 33. Pilot acceptance criteria

All recipient types; Easy Read consent; zero disclosure incidents.

## 34. Scale acceptance criteria

Delegates; emergency; analytics opt-in aggregation only.

## 35. KPIs

Consent comprehension; revocation success; unauthorised disclosure = 0.

## 36. Risks

R02 universal disclosure; R04 unauthorised sharing.

## 37. Mitigations

Scope matrix; receipts; employer default off.

## 38. Dependencies

E01 soft; blocks E03, E07, E11.

## 39. Recommended owner/team

Participant Experience Team

## 40. Delivery horizon

Foundation Wave

## 41. Current claim state

**Implemented, not independently verified**

## 42. Evidence required before claim-state promotion

Schema exists (AccessPassport). Promote after G4 proves recipient-type sharing, <60s revocation, and zero unauthorised disclosure in pilot.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-02-personal-access-passport-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-02-personal-access-passport-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-02-personal-access-passport-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-02-personal-access-passport-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-02-personal-access-passport-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-02-personal-access-passport-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-02-personal-access-passport-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Passport CRUD + requirement ontology | EXTEND | `AccessPassport, lib/access/infrastructure/` |
| 2 | Granular disclosure scopes | EXTEND | `ParticipantAccessReceipt` |
| 3 | Purpose-bound consent + receipts | REUSE/EXTEND | `ConsentRecord, lib/consent/*` |
| 4 | Sharing controls by recipient type | NEW | `venues/workers/drivers/employers/AI/emergency` |
| 5 | Access log + participant review | EXTEND | `DataAccessLog, Trust Fabric` |
| 6 | Passport compatibility projection | EXTEND | `lib/access/infrastructure/compatibility.ts` |
| 7 | Non-disclosure guardrails | NEW | `containsDiagnosis=false enforced` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Participant interviews document repeat disclosure burden | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Share→receipt→revoke→block re-read demonstrated | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
