# Epic 10 — Funding & Payment Integrity Engine

> **Azure DevOps Epic key:** `mapable-epic-10-funding-payment-integrity`  
> **Priority:** P2 | **Horizon:** Controlled Intelligence Wave  
> **Current claim state:** In development

---

## 1. Epic title

Funding & Payment Integrity Engine

## 2. Epic ID / proposed slug

`mapable-epic-10-funding-payment-integrity`

## 3. Strategic outcome

Advisory financial evidence and integrity layer — not autonomous claiming.

## 4. Participant outcome

Understand pricing and invoices with plain explanations; review anomalies before paying or claiming.

## 5. Problem statement

Invoices and NDIS pathways are opaque; AI may overclaim fundability.

## 6. Scope

Pricing explanations, quote comparison, service evidence, invoice anomaly/duplicate detection, rate comparison, participant review, draft funding questions, reconciliation assistance.

## 7. Explicit non-goals

Definitive NDIS claimable without deterministic rule; autonomous claiming; NDIA live without approval.

## 8. User groups

Participants, plan managers, providers, billing admins.

## 9. Example user journeys

1. Invoice flagged duplicate; participant reviews advisory notice.
2. Copilot explains line items; suggests questions for plan manager — not 'definitely claimable'.
3. High-impact anomaly escalates to human billing review.

## 10. Functional capabilities

- Deterministic anomaly rules
- Advisory funding pathway language
- Quote comparison across transport/care
- Participant review workflow

## 11. Shared Core dependencies

FundingSource, Quote, Invoice, Payment, Reconciliation, Document, EvidenceItem, AuditEvent.

## 12. Cross-Epic dependencies

Uses Care/Transport billing handoff; after Foundation stable.

## 13. Data entities

BillingInvoice*, BillingPayment*, NdisClaim*, audit logs.

## 14. APIs/events required

/api/billing/copilot/*; anomaly webhooks internal.

## 15. Permission model

Participant sees own; provider scoped; admin reconciliation.

## 16. Consent requirements

Billing data not shared to employers via AI comms.

## 17. Human approval gates

High-value anomaly resolution; any auto-export to NDIA (blocked until official enable).

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

Financial data classification; encrypted at rest.

## 20. Safeguarding requirements

Fraud reports to trust queue.

## 21. AI use, if any

Explain, summarise, draft questions, low-risk anomaly hints — deterministic rules validate.

## 22. AI prohibited decisions

Definitive claimable without rule; auto-submit claims; spend approval.

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

ClaimAuditEvent; copilot trace retention.

## 25. Observability requirements

Anomaly rate; false positive; participant override rate.

## 26. Complaints/correction path

Billing dispute + engagement complaints.

## 27. Feature flags

BILLING_NDIA_OFFICIAL_ENABLED=false; billing copilot flags.

## 28. Failure and fallback behaviour

Human plan manager; CSV export; non-AI invoice view.

## 29. Security requirements

PCI boundaries; no card data in AI context.

## 30. Definition of Ready

G0–G2; advisory language approved by legal/compliance review.

## 31. Definition of Done

Eval includes incorrect funding claim case; zero definitive AI claims in pilot.

## 32. MVP acceptance criteria

Duplicate detection + plain pricing explanation.

## 33. Pilot acceptance criteria

10 participants review anomalies; advisory wording 100%.

## 34. Scale acceptance criteria

Plan manager integrations.

## 35. KPIs

Unsupported-claim rate; participant review completion.

## 36. Risks

R09 NDIS overclaim.

## 37. Mitigations

Deterministic rules; advisory copy.

## 38. Dependencies

Billing Centre REUSE.

## 39. Recommended owner/team

Billing Platform Team

## 40. Delivery horizon

Controlled Intelligence Wave

## 41. Current claim state

**In development**

## 42. Evidence required before claim-state promotion

Billing copilot deterministic; NDIA live blocked. Advisory integrity layer not verified live.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-10-funding-payment-integrity-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-10-funding-payment-integrity-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-10-funding-payment-integrity-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-10-funding-payment-integrity-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-10-funding-payment-integrity-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-10-funding-payment-integrity-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-10-funding-payment-integrity-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Pricing explanation layer | EXTEND | `billing copilot` |
| 2 | Quote comparison | EXTEND | `TransportQuote*` |
| 3 | Invoice anomaly + duplicate detection | EXTEND | `BillingInvoice*` |
| 4 | Advisory funding pathway language | NEW | `deterministic rules only` |
| 5 | Participant review + draft questions | NEW | `human-in-loop` |
| 6 | Reconciliation assistance | EXTEND | `billing centre` |
| 7 | Funding integrity evals | NEW | `incorrect funding claim case` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Billing complaints/support show opacity pain | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Anomaly flagged with advisory text only | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
