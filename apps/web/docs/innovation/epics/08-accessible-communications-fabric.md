# Epic 08 — Accessible Communications Fabric

> **Azure DevOps Epic key:** `mapable-epic-08-accessible-communications-fabric`  
> **Priority:** P1 | **Horizon:** Experience Wave  
> **Current claim state:** In development

---

## 1. Epic title

Accessible Communications Fabric

## 2. Epic ID / proposed slug

`mapable-epic-08-accessible-communications-fabric`

## 3. Strategic outcome

Shared accessible communication layer across MapAble.

## 4. Participant outcome

Ask 'where is my driver?' and get plain-language status, next steps, and human help without a phone tree.

## 5. Problem statement

Status updates force voice calls, inaccessible chat, or fragmented SMS/email.

## 6. Scope

In-app, SMS, voice (optional), accessible web chat, WhatsApp/RCS where appropriate, email, AAC-friendly text. Preferences, no-voice-required, plain-language, escalation, emergency boundaries.

## 7. Explicit non-goals

Clinical or payment-card data in general agent context; inaccessible IVR as only path.

## 8. User groups

Participants, workers, drivers, support, providers.

## 9. Example user journeys

1. Participant prefers SMS + plain language; driver delay explained with ETA and escalation button.
2. AAC user uses text-only chat; human handoff within SLA.
3. Emergency boundary: system provides 000 guidance, not clinical advice.

## 10. Functional capabilities

- Communication preference SoT
- Multi-channel adapter with preference routing
- AAC-friendly and plain-language templates
- Accessible escalation without required voice
- Service-status explain + next steps

## 11. Shared Core dependencies

CommunicationPreference, MessageThread, Notification, User.

## 12. Cross-Epic dependencies

Enables E07 status updates; used by all verticals.

## 13. Data entities

Conversation, Message, Notification, communication prefs.

## 14. APIs/events required

/api/messages; /api/notifications; channel webhooks.

## 15. Permission model

Participants control channels; workers see job threads only.

## 16. Consent requirements

Channel opt-in; marketing separate from transactional.

## 17. Human approval gates

Emergency template changes; new channel enablement.

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

Message retention policy; no cross-thread leakage.

## 20. Safeguarding requirements

Emergency boundaries documented; mandatory escalation paths tested.

## 21. AI use, if any

Plain-language summarisation of status — no clinical/financial advice.

## 22. AI prohibited decisions

Clinical triage; payment card handling in general context.

## 23. AI eval requirements

Accessibility fallback required; escalation required.

## 24. Audit requirements

Escalation events logged; channel delivery receipts.

## 25. Observability requirements

Delivery success; escalation SLA; channel failure rates.

## 26. Complaints/correction path

SupportTicket + Complaint integration.

## 27. Feature flags

MAPABLE_COMMUNICATION_PASSPORT_ENABLED; mobile comm flags.

## 28. Failure and fallback behaviour

Email digest; in-app inbox always available.

## 29. Security requirements

Channel auth; spam rate limits.

## 30. Definition of Ready

G0–G2; preference model co-designed.

## 31. Definition of Done

No-voice path tested with AT; escalation SLA met.

## 32. MVP acceptance criteria

In-app + email status for transport pilot.

## 33. Pilot acceptance criteria

SMS + plain language; human handoff <4h.

## 34. Scale acceptance criteria

WhatsApp/RCS where policy allows.

## 35. KPIs

Escalation SLA; voice-independent completion rate.

## 36. Risks

R18 phone tree dependency.

## 37. Mitigations

No-voice-required default option.

## 38. Dependencies

Messaging REUSE; parallel to E03.

## 39. Recommended owner/team

Comms Platform Team

## 40. Delivery horizon

Experience Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

Messaging and Communication Passport flag exist; multi-channel AAC escalation incomplete.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-08-accessible-communications-fabric-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-08-accessible-communications-fabric-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-08-accessible-communications-fabric-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-08-accessible-communications-fabric-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-08-accessible-communications-fabric-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-08-accessible-communications-fabric-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-08-accessible-communications-fabric-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Communication preference SoT | EXTEND | `lib/communication/*` |
| 2 | Multi-channel adapter layer | NEW/EXTEND | `Message, SendGrid, SMS` |
| 3 | AAC-friendly + plain-language | NEW | `Easy Read templates` |
| 4 | No-voice-required escalation | NEW | `human handoff` |
| 5 | Service-status explain | EXTEND | `transport/care status` |
| 6 | Emergency escalation boundaries | NEW | `safeguarding docs` |
| 7 | Clinical/payment data isolation | REUSE | `existing boundaries` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Support tickets cite inaccessible comms | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Multi-channel status + escalation demo | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
