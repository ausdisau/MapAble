# MapAble Innovation Portfolio — Risk Register

**Review cadence:** Monthly at programme level; per-Epic at G4/G5 gates  
**Severity:** Critical | High | Medium | Low

---

## Top programme risks

| ID | Risk | Severity | Epics | Mitigation | Owner |
|----|------|----------|-------|------------|-------|
| R01 | Presenting AI-inferred or community-reported access data as verified fact | Critical | E01, E03, E04, E13 | Provenance labels mandatory; UI uncertainty; eval suite; no CV-only accreditation | Access Platform |
| R02 | Access Passport becomes universal disability disclosure record | Critical | E02, E07, E11 | Purpose-bound consent; granular scopes; no diagnosis fields in matching payloads; participant review | Privacy + Product |
| R03 | Orchestration agent executes consequential actions without approval | Critical | E07 | MODEL→POLICY→PARTICIPANT→EXECUTE; typed tools; forbidden actions list; audit | AI Platform |
| R04 | Unauthorised disclosure of passport data to employers/providers/AI | Critical | E02, E07, E11, E13 | Disclosure receipts; access logs; API hard boundary; zero-incident KPI | Privacy |
| R05 | Credential expiry silently treated as approval | High | E09, E15, E06 | Deterministic gates; fail-closed; exception workflow only with human approval | Trust Platform |
| R06 | Paternalistic risk elimination blocks participant autonomy | High | E07, Care, Transport | Dignity of risk policy; supported decision-making; override without penalty | Safeguarding |
| R07 | WCAG regressions ship via fast iteration | High | All user-facing | Manual AT testing gate; a11y CI; G2/G5 requirements | Accessibility |
| R08 | Duplicate Shared Core (second consent/audit/identity system) | High | All | Architecture review at G3; explicit non-goals in Epics | Platform Architecture |
| R09 | NDIS/funding AI overclaims ("definitely claimable") | Critical | E10 | Deterministic rules only for definitive claims; advisory language; human review | Billing + AI |
| R10 | Identifiable participant journeys exposed in Observatory/API | Critical | E13, E14 | Aggregation k-anonymity; no passport in public API; privacy review | Privacy |
| R11 | Course completion represented as professional competence | High | E15 | Capability Passport ≠ course certificate; supervised practice requirements | Academy |
| R12 | AT marketplace implies clinical safety/prescription | High | E12 | Explicit non-claims; Equipment Passport evidence; no auto-funding | AT Programme |
| R13 | Co-design tokenism | High | All | G1 gate; paid DRO time; documented sign-off | Co-Design Lead |
| R14 | Strategy doc assumed implemented | Medium | All | Claim states; repo as SoT; CAPABILITY_REGISTRY honesty | Product |
| R15 | Pilot marketed as national live capability | High | All | Feature flags; ConvergenceOS claim gates; kill criteria | Product + Comms |
| R16 | Indoor/digital twin R&D promoted before spatial evidence | Medium | E05 | R&D wave; DEFER features; evidence requirements | Access R&D |
| R17 | Multi-agent swarm complexity without eval benefit | Medium | E07 | One orchestrator first; specialist agents only with measurable benefit | AI Platform |
| R18 | Inaccessible communication escalation (phone trees) | High | E08 | No-voice-required; AAC-friendly; human handoff | Comms Platform |

---

## Safeguarding-specific risks

| ID | Risk | Mitigation |
|----|------|------------|
| S01 | AI determines abuse/reportability | Prohibited; human escalation only |
| S02 | AI determines restrictive practices | Prohibited; clinical boundaries doc |
| S03 | Emergency escalation under-tested | G4 runbook; boundary testing with safeguarding lead |
| S04 | Break-glass access abused | BreakGlassAccessSession audit; time-bound; review queue |

---

## Privacy/consent blockers (programme-level)

These must be resolved before **G4** for affected Epics:

1. **E02:** Recipient-type sharing matrix implemented with revocation tested under load.
2. **E07:** Agent context boundary — no passport fields in prompts without explicit scoped consent.
3. **E11:** Employer visibility defaults — zero automatic disability disclosure.
4. **E13/E14:** Public API and aggregates mathematically cannot re-identify participants.

---

## Accessibility blockers (programme-level)

1. No Epic reaches **G5** without manual screen-reader + keyboard + switch sample on primary flows.
2. Plain-language / Easy Read summaries required for consent and consequential plans (E02, E07).
3. Voice-independent workflow mandatory for E08 status and escalation paths.

---

## AI governance blockers (programme-level)

1. Minimum 15-case eval suite passing before E07 G4.
2. E04 computer vision outputs locked to `AI_INFERRED — UNVERIFIED` until human verification.
3. `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` remains false until ConvergenceOS approves per capability.

---

## Risk acceptance

Risks R01–R04, R09, R10 are **not acceptable** at any gate — fail closed.  
R06 dignity-of-risk violations require safeguarding review before any workaround.
