# MapAble Innovation Portfolio — KPI Framework

**Purpose:** Portfolio-level and Epic-contributing metrics. All targets require honest claim-state labelling; synthetic pilots use separate cohort tags.

---

## 1. Access Intelligence

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Places with feature-level evidence | % of `AccessPlace` records with ≥1 attributed `AccessObservation` | E01, E06 | 10% pilot cohort | 40% active regions |
| Evidence freshness | % observations within freshness SLA (by verification class) | E01, E06 | 70% within SLA | 85% |
| Verified observations | Count/status `independently_verified` + `assessor_measured` | E01, E06, E04 | Baseline established | +20% YoY |
| Successful corrections | Disputes resolved with graph update + participant notified | E01 | 90% within 14 days | 95% |
| False/inaccurate report rate | Corrections ÷ total observations (rolling 90d) | E01, E04 | <15% pilot | <8% |
| Accessible-route completion | Journeys completed without required-segment failure | E03, E07 | 70% pilot | 85% |

---

## 2. Participant Control

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Consent comprehension | Post-consent quiz/check (where used) pass rate | E02, E07 | 80% | 90% |
| Disclosure revocation success | Revocations honoured within 60s system-wide | E02 | 100% | 100% |
| Participant override rate | User rejects recommendation ÷ recommendations shown | E07, E03 | Track baseline | No punitive UX on override |
| Recommendation accept/reject | Informed accept rate with documented reasoning | E07 | Baseline | Stable with satisfaction |
| Unauthorised disclosure incidents | Count of confirmed breaches | All | **0** | **0** |

---

## 3. Care / Transport

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Coordinated journey completion | Slice journeys reaching outcome receipt | E07, E03, vertical reuse | 65% pilot | 80% |
| Vehicle mismatch rate | Trips where vehicle ≠ passport requirements | E03, Transport | <5% | <2% |
| Missed support rate | Care shifts not delivered when requested | Care reuse | <10% pilot | <5% |
| Participant-requested change success | Changes/cancellations completed accessibly | E08, E07 | 90% | 95% |

---

## 4. Jobs

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Interview accessibility | Interviews with documented access plan | E11, E03 | 80% pilot | 95% |
| Placement rate | Offers ÷ qualified applications (cohort) | E11 | Baseline | Improve vs baseline |
| Adjustment fulfilment | Requested adjustments met before start | E11 | 85% | 95% |
| Transport sustainability | Placements with viable commute plan at 13w | E11, E03 | 70% | 85% |
| Retention | 13 / 26 / 52-week retention | E11 | Baseline | Industry-competitive |

---

## 5. Trust

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Credential-expiry exceptions | Approved exceptions ÷ expiring credentials | E09, E15 | 100% documented | 100% documented |
| Incident response | Median time to first human response | E08, safeguarding | <4h pilot | <2h |
| Complaints resolution | Resolved within SLA | All | 90% | 95% |
| Disputed evidence corrections | Graph updates after dispute | E01, E06 | 90% | 95% |

---

## 6. AI

| KPI | Definition | Primary Epics | MVP target | Scale target |
|-----|------------|---------------|------------|--------------|
| Task success | Eval pass rate on governed tasks | E04, E07, E10 | ≥85% eval suite | ≥92% |
| Unsupported-claim rate | Outputs with unverified accessibility/funding claims | E04, E07, E10 | <2% | <0.5% |
| Unsafe recommendation rate | Eval failures on unsafe actions | E07 | 0 in prod pilot | 0 |
| Escalation precision | True escalations ÷ total escalations | E07, E08 | ≥80% | ≥90% |
| Tool misuse | Forbidden tool invocations blocked | E07 | 100% blocked | 100% |
| Forbidden action attempts | Logged and blocked | E07, E10 | 100% | 100% |
| Non-AI fallback success | Users completing task via fallback | E07, E04 | ≥95% | ≥98% |
| Accessibility parity | Fallback UX meets WCAG same as AI path | All AI Epics | Pass manual AT | Pass |
| Cohort disparity | Outcome variance across disability cohorts | E07, E11 | Monitored; explain | No unexplained gap >10pp |

---

## Epic KPI ownership

| Epic | Primary KPI categories |
|------|------------------------|
| E01 | Access Intelligence, Trust |
| E02 | Participant Control |
| E03 | Access Intelligence, Care/Transport |
| E04 | Access Intelligence, AI |
| E05 | Access Intelligence (R&D metrics) |
| E06 | Access Intelligence, Trust |
| E07 | Participant Control, AI, Care/Transport |
| E08 | Participant Control, Trust, Care/Transport |
| E09 | Trust |
| E10 | AI, Trust |
| E11 | Jobs, Participant Control |
| E12 | Trust (R&D) |
| E13 | Access Intelligence (API quality) |
| E14 | Access Intelligence (aggregate) |
| E15 | Trust, Jobs |

---

## Measurement honesty

- **Verified live** KPIs require production telemetry with independent verification where stated.
- Pilot/synthetic cohorts must be tagged in analytics; never merge with production claims.
- See [CAPABILITY_REGISTRY.md](../productisation/CAPABILITY_REGISTRY.md) for public claim gates.
