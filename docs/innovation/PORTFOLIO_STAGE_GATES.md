# MapAble Innovation Portfolio — Stage Gates (G0–G6)

**Programme:** MapAble Innovation Portfolio  
**Owner:** Head of Product (accountable)  
**Applies to:** All 15 Epics and their Features  
**Aligned with:** [Co-Design Protocol](../co-design-protocol.md), CareOS consent/safeguarding docs, feature-flag pilot patterns

Every Epic and user-facing Feature must pass through these gates. Gates are **sequential** unless a programme exception is recorded with evidence.

---

## G0 — Problem Evidence

**Purpose:** Confirm the problem is real, affects disabled participants materially, and is worth solving within MapAble's flywheel.

| Pass criteria | Fail criteria |
|---|---|
| Documented pain points from ≥3 independent sources (support tickets, pilot data, DRO feedback, research, or operational metrics) | Problem asserted only from strategy docs without participant evidence |
| Clear link to flywheel: evidence → control → journey → coordination → participation → better evidence | Solution seeking a problem; duplicate of existing Epic |
| Baseline metrics or qualitative evidence captured | No measurable or observable baseline |
| Explicit statement of who is **not** served if we defer | Vague beneficiary group |

**Evidence artefacts:** problem brief, support/complaint excerpts (de-identified), research citations, pilot retrospective.

---

## G1 — Disability-Led Co-design

**Purpose:** Meaningful co-design with disabled people affected by the capability — not token consultation.

| Pass criteria | Fail criteria |
|---|---|
| Co-design sessions completed per [Co-Design Protocol](../co-design-protocol.md) stages S0–S1 minimum | Internal-only design review |
| Relevant DRO partners engaged (PWDA/AFDO mandatory; FPDN for First Nations scope; Inclusion Australia for Easy Read/intellectual disability scope) | Single advisory call without paid, documented feedback |
| Design artefacts revised in response to feedback; dissent recorded | Feedback collected but not incorporated without rationale |
| Accessible formats used (Easy Read summary where appropriate) | PDF-only or inaccessible workshop materials |
| Named accountable human for HITL features before participant rollout | AI-first design without human accountability |

**Evidence artefacts:** co-design sign-off record, revised wireframes/copy, Easy Read summary, engagement register.

---

## G2 — Rights, Accessibility & Risk Review

**Purpose:** Rights-based review before build investment.

| Pass criteria | Fail criteria |
|---|---|
| Autonomy, consent, privacy, accessibility, safeguarding, bias, data use, regulatory exposure, dignity of risk, complaints path, and non-AI fallback reviewed | Checklist ticked without named reviewers |
| WCAG 2.2 AA release criteria defined for user-facing scope | Accessibility deferred to "later" |
| Purpose-bound consent and minimum-necessary disclosure documented | Blanket data collection without purpose |
| AI prohibited decisions listed (if AI-enabled) | Open-ended model authority |
| Paternalistic risk elimination flagged and rejected where dignity of risk applies | "Block all risky choices" as default |
| Non-AI fallback path defined | AI-only workflow |

**Evidence artefacts:** G2 review record, privacy impact notes, safeguarding boundary doc, AI prohibited-uses list.

**Reviewers (minimum):** Product, Privacy/Data, Accessibility lead, Safeguarding lead; DRO representative for participant-facing scope.

---

## G3 — Technical Proof

**Purpose:** Smallest end-to-end proof demonstrating feasibility without production claims.

| Pass criteria | Fail criteria |
|---|---|
| End-to-end slice works in dev/staging with honest synthetic or pilot data labels | Mock data presented as verified live |
| Shared Core dependencies identified; no duplicate identity/consent/audit systems introduced | Parallel SoT created inside a vertical |
| Schema/API contract draft aligned with Prisma SoT where applicable | Orphan prototype outside repo conventions |
| Feature flag or environment gate in place | Ungated experimental code on default path |
| Automated tests for deterministic core paths | Proof relies on manual demo only |

**Evidence artefacts:** demo recording, test output, architecture sketch, flag name documented.

---

## G4 — Controlled Pilot

**Purpose:** Limited cohort validation with monitoring, rollback, and human escalation.

| Pass criteria | Fail criteria |
|---|---|
| Feature flag enabled for defined cohort only | Broad enablement without evidence |
| Monitoring dashboards and alert thresholds active | No observability |
| Documented rollback procedure tested | Rollback untested |
| Support process and human escalation path operational | Participants trapped in bot-only flows |
| Incident handling runbook linked | No incident owner |
| Kill criteria defined (see Starting Work pilot pattern) | Open-ended pilot without exit criteria |
| Claim state honestly labelled (not "Verified live" unless independently verified) | Marketing language ahead of evidence |

**Evidence artefacts:** pilot runbook, cohort definition, monitoring links, rollback drill record, support queue SOP.

---

## G5 — Evidence to Scale

**Purpose:** Pilot evidence supports broader rollout.

| Pass criteria | Fail criteria |
|---|---|
| KPI targets met or variances explained with remediation plan | KPIs ignored |
| Accessibility regression testing passed (automated + manual AT) | Automated-only sign-off |
| Zero unauthorised disclosure incidents (or fully remediated with root cause) | Unresolved privacy incidents |
| Complaints/incidents within acceptable thresholds | Unaddressed safeguarding concerns |
| Co-design partners consulted on scale changes affecting participants | Scale decision internal-only |
| Cost/operational sustainability assessed | Uncapped manual processes |

**Evidence artefacts:** pilot report, KPI dashboard export, a11y test report, complaint summary, scale recommendation.

---

## G6 — Continuous Assurance

**Purpose:** Ongoing monitoring after scale.

| Pass criteria (ongoing) | Fail criteria (triggers rollback/review) |
|---|---|
| Accessibility regression suite in CI; periodic manual AT audits | WCAG regressions unaddressed >1 sprint |
| Consent failure alerts monitored | Undetected over-disclosure |
| Data-quality and freshness metrics tracked (Access Graph Epics) | Stale data presented as current |
| Credential expiry never silently converts to approval | Expired credentials treated as valid |
| AI eval suite run on model/prompt changes | Ungoverned model updates |
| Cohort disparity monitoring for AI features | Unexplained disparity |
| Complaint and incident trends reviewed monthly | Rising unresolved complaints |

**Evidence artefacts:** monthly assurance report, eval run logs, drift monitoring, correction/dispute metrics.

---

## Stage-gate Features (Azure DevOps)

Each Epic includes seven Features for programme tracking:

| Feature key | Gate |
|---|---|
| `{epic-slug}-gate-g0-problem-evidence` | G0 |
| `{epic-slug}-gate-g1-co-design` | G1 |
| `{epic-slug}-gate-g2-rights-review` | G2 |
| `{epic-slug}-gate-g3-technical-proof` | G3 |
| `{epic-slug}-gate-g4-controlled-pilot` | G4 |
| `{epic-slug}-gate-g5-evidence-to-scale` | G5 |
| `{epic-slug}-gate-g6-continuous-assurance` | G6 |

Gate Features inherit pass/fail criteria from this document; Epic-specific criteria are documented in each Epic file §30–34.

---

## Programme decision rule at gates

At every gate ask: **Does this capability give disabled people more reliable information, more control over decisions, or a substantially easier path to participation?**

If not, **fail or defer** — do not proceed to scale.
