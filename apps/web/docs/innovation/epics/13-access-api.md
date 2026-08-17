# Epic 13 — MapAble Access API

> **Azure DevOps Epic key:** `mapable-epic-13-access-api`  
> **Priority:** P2 | **Horizon:** Platform Commercialisation Wave  
> **Current claim state:** Proposed

---

## 1. Epic title

MapAble Access API

## 2. Epic ID / proposed slug

`mapable-epic-13-access-api`

## 3. Strategic outcome

Productise verified accessibility information with provenance — never participant passports.

## 4. Participant outcome

Benefit from councils and venues using consistent verified access data in their apps.

## 5. Problem statement

External orgs need machine-readable access data; internal graph not yet productised.

## 6. Scope

/places, /access-features, /access-observations, /verifications, /routes, /venue-access, /workplace-access, /transport-access with provenance, rate limits, licensing, versioning.

## 7. Explicit non-goals

Passport endpoints on public API; unverified data without labels; PII exposure.

## 8. User groups

Councils, transport operators, employers, tourism, developers, mapping providers.

## 9. Example user journeys

1. Council app fetches place features with confidence and expiry.
2. Partner receives webhook on verification state change.
3. Developer key revoked on licence violation.

## 10. Functional capabilities

- Public resource model with provenance on every field
- Rate limiting and partner licensing
- Versioning and change history
- Hard privacy boundary — no passport routes

## 11. Shared Core dependencies

Place, AccessFeature, AccessObservation, Verification, AuditEvent.

## 12. Cross-Epic dependencies

Requires E01 verified pipeline; E06 for verification resource.

## 13. Data entities

Partner API keys, licence records, API access logs.

## 14. APIs/events required

Public REST /v1/access/*; change webhooks.

## 15. Permission model

API key scoped by resource and region; no participant data scopes.

## 16. Consent requirements

Not applicable to public place data; aggregate only.

## 17. Human approval gates

Partner onboarding; licence tier changes.

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

Mathematical impossibility of passport re-identification from API; privacy review mandatory.

## 20. Safeguarding requirements

Abuse reporting for API misuse.

## 21. AI use, if any

None on public API layer.

## 22. AI prohibited decisions

N/A

## 23. AI eval requirements

N/A

## 24. Audit requirements

API access logs; key rotation events.

## 25. Observability requirements

Rate limit hits; error rates; partner SLA.

## 26. Complaints/correction path

Partner dispute; data correction via E01.

## 27. Feature flags

API_CERTIFICATION_V2_* proposed.

## 28. Failure and fallback behaviour

Partners use bulk export with same provenance rules.

## 29. Security requirements

OAuth/API keys; WAF; abuse detection.

## 30. Definition of Ready

G0–G2; E01 pilot data quality threshold met.

## 31. Definition of Done

One partner integrated with provenance contract tests.

## 32. MVP acceptance criteria

Read-only /places + /access-features for pilot partner.

## 33. Pilot acceptance criteria

3 partners; SLA 99.5%; zero passport leakage tests pass.

## 34. Scale acceptance criteria

Tiered licensing; national coverage claims only with G5.

## 35. KPIs

API accuracy vs graph; partner correction rate.

## 36. Risks

R10 passport leakage via API.

## 37. Mitigations

Hard boundary; penetration test.

## 38. Dependencies

E01, E06 required.

## 39. Recommended owner/team

Developer Platform Team

## 40. Delivery horizon

Platform Commercialisation Wave

## 41. Current claim state

**Proposed**

## 42. Evidence required before claim-state promotion

Developer-api docs and partner API keys partial. Public access API not verified live.

---

## Azure DevOps Features

### Stage-gate Features

| Gate | Feature key | Pass summary |
|------|-------------|--------------|
| G0 | `mapable-epic-13-access-api-gate-g0-problem-evidence` | Problem evidence from ≥3 sources |
| G1 | `mapable-epic-13-access-api-gate-g1-co-design` | DRO co-design per co-design-protocol.md |
| G2 | `mapable-epic-13-access-api-gate-g2-rights-review` | Rights, a11y, privacy, safeguarding review |
| G3 | `mapable-epic-13-access-api-gate-g3-technical-proof` | End-to-end proof behind feature flag |
| G4 | `mapable-epic-13-access-api-gate-g4-controlled-pilot` | Limited cohort; monitoring; rollback |
| G5 | `mapable-epic-13-access-api-gate-g5-evidence-to-scale` | KPI + manual AT evidence |
| G6 | `mapable-epic-13-access-api-gate-g6-continuous-assurance` | Ongoing monitoring active |

### Product Features

| # | Feature | Classification | Repo anchor |
|---|---------|----------------|-------------|
| 1 | Public API resource model | EXTEND | `docs/developer-api/` |
| 2 | Provenance + confidence in responses | EXTEND | `graph provenance` |
| 3 | Rate limiting + licensing | NEW/EXTEND | `partner API keys` |
| 4 | Privacy boundaries | NEW | `no passport exposure` |
| 5 | Versioning + change history | NEW | `—` |
| 6 | Partner onboarding | EXTEND | `org/API keys` |

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | Partner demand letters/LOIs documented | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | Partner reads place with provenance fields | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
