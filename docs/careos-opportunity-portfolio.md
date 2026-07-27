# CareOS Opportunity Portfolio

**Programme tip inspected:** `agent/careos-national-platform`  
**Related work:** `agent/careos-platform-completion` (canonical mission SoR in flight — treat as dependency, not a second Core)  
**Date:** 2026-07-14  
**Mode:** Read-only research (no runtime behaviour changed)

## Ranking method

Each opportunity scored 1–5 on:

| Dimension | High score means |
|-----------|------------------|
| Participant value (PV) | Direct sovereignty, continuity, dignity |
| Safety impact (SI) | Reduces harm / unsafe automation |
| Regulatory urgency (RU) | External deadline / compliance pressure |
| Strategic differentiation (SD) | Hard for commoditised platforms to copy ethically |
| Commercial value (CV) | Sustainable revenue without exploiting participants |
| Implementation complexity (IC*) | *Inverted in composite: 5 = low complexity* |
| Dependency readiness (DR) | Landed building blocks in-repo |
| Evidence quality (EQ) | Code + policy evidence strength |

**Composite** = average of the eight scores (IC inverted). Horizons: Immediate 0–6m · Near 6–18m · Longer 18–36m · Research 3+y.

Non-negotiables for every proposal: participant authority; no automated eligibility/diagnosis/payment/claim/provider selection; no risk/worthiness scores; unknown remains unknown; non-AI pathways; consequential actions require explicit authority; **canonical CareOS mission + event spine only** — never a parallel CareOS Core.

---

## Opportunity catalogue (12 research streams)

### O1 — Architecture & schema convergence
| Field | Finding |
|-------|---------|
| Existing | Tip `CareOSMission` (`missionType`/`inputSummary`); fabric quarantine competing shape; `CloudEventOutbox`; Temporal `WorkflowRun`; dual trees `intelligence/` vs `lib/intelligence/careos/` |
| Conflicts | Dual `careos_missions` CREATE; `$executeRaw` vs Prisma; dual flag/prohibited-use registries |
| Unmet need | Single mission identity for SC links, network, appointments, outbox |
| Driver | Production migration integrity; unblock completion PR |
| Product | **Convergence Programme** (extend tip SoR; rewrite fabric persistence; unify flags) |
| MVP slice | One schema + Prisma rewrite + one green mission test matrix |
| Models/APIs | Unified CareOS* children; tip + fabric API consolidation |
| Authority/Safety | Server-built authority only; persistence fail-closed until SoR stable |
| Ops/Commercial | Platform debt repayment; unlocks all SKUs |
| Deps | Completion branch Task A |
| Complexity | **L** |
| Risks | Wrong SoR breaks `linkedMissionId` / fabric UX |
| Success | Single CREATE; zero undeclared-column SQL; one flag namespace |
| Scores | PV4 SI5 RU5 SD3 CV3 IC2 DR4 EQ5 → **composite ~3.9** · Immediate |

### O2 — NDIS digital-platform registration readiness
| Field | Finding |
|-------|---------|
| Existing | `NdiaApiReadinessChecklist`, evidence bundles, verification claims, quality accreditation, worker screening pathways; AbilityPay claim flags **hard off** |
| Conflicts | Readiness vs claiming vs portal adapters triplicated |
| Unmet need | Human registration evidence pack for platforms (not claim bots) |
| Driver | **Mandatory registration for NDIS digital platform providers from 1 July 2026** (NDIS Commission); unregistered platforms apply by ~1 Oct 2026 transition; worker screening obligations follow |
| Product | **Platform Registration Readiness Pack** — checklists, audits, worker screening evidence index, incident/QMS links; **prepare only** |
| MVP | Admin/provider UI exporting pack against Practice Standards; no live claim submit |
| Authority/Safety | Admin/provider-admin; **no eligibility/claim automation** |
| Commercial | Implementation/regulatory readiness services + retention of marketplace licence to operate |
| Complexity | **M** |
| Success | Pack used in human registration applications; claim flags stay false |
| Scores | PV4 SI5 RU5 SD4 CV4 IC3 DR4 EQ5 → **~4.3** · Immediate |

Sources: [NDIS Commission platform providers](https://www.ndiscommission.gov.au/rules-and-standards/quality-practice/platform-providers); [mandatory registration hub](https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration); [NDIS news](https://www.ndis.gov.au/news/11561-mandatory-registration-supported-independent-living-sil-and-ndis-digital-platform-providers).

### O3 — Cross-scheme & foundational supports
| Field | Finding |
|-------|---------|
| Existing | Funding enums (`aged_care`, grants); SC OS; Home Living; Jobs; AbilityPay expected cost |
| Gaps | Dual funding taxonomies; little foundational-support product surface |
| Driver | National Agreement on Foundational Supports 2026–31; Thriving Kids phase; NDIS Review ecosystem model |
| Product | **Multi-scheme mission coordination** — scheme tags + navigation briefs; never eligibility scores |
| MVP | Taxonomy bridge + SC/Home Living labels + YPIRAC caution hooks |
| Complexity | **L** |
| Scores | PV5 SI4 RU4 SD5 CV3 IC2 DR3 EQ4 → **~3.8** · Near |

Sources: [Foundational Supports National Agreement](https://federalfinancialrelations.gov.au/agreements/national-agreement-foundational-supports).

### O4 — Health / FHIR interoperability
| Field | Finding |
|-------|---------|
| Existing | FHIR sync stubs (Patient/Appointment); Moves clinical boundaries; telehealth adapters; evaluation `clinical_boundary` |
| Product | **FHIR light read** (Document/Allergy/Appointment display) under consent; **no MHR without separate regulated programme** |
| Complexity | **M** (MHR = XL deferred) |
| Scores | PV3 SI4 RU2 SD3 CV3 IC3 DR3 EQ4 → **~3.1** · Near |

### O5 — Participant credential & consent wallet
| Field | Finding |
|-------|---------|
| Existing | Authority grants, consent + receipts, privacy UI, document grants (incomplete write), passkeys/Keycloak = login |
| Product | **Consent & Credential Wallet** control plane over time-limited grants — not NextAuth replacement |
| MVP | Issue/revoke grant for document or delegate action from privacy centre |
| Complexity | **M** |
| Scores | PV5 SI5 RU3 SD5 CV3 IC3 DR4 EQ4 → **~4.0** · Near |

### O6 — AI assurance & continuous safety testing
| Field | Finding |
|-------|---------|
| Existing | 9-scenario harness; admin panel; dual prohibited lists; CareOS CI omits harness |
| Product | **Safety Evaluation Gate** — CI+nightly; signed reports; block AI-path PRs on fail |
| Complexity | **M→L** |
| Scores | PV4 SI5 RU4 SD4 CV2 IC3 DR4 EQ4 → **~3.8** · Immediate |

### O7 — Thin-market & regional architecture
| Field | Finding |
|-------|---------|
| Existing | Marketplace fairness doctrine; capacity honesty; continuity recovery; federation trusts |
| Conflict | Matching-service factor scores vs marketplace “no best ranking” |
| Product | **Thin-Market Continuity Coordinator** — Available/Limited/Unknown/Escalate; no participant risk scores |
| Complexity | **L** |
| Scores | PV5 SI4 RU3 SD5 CV3 IC2 DR3 EQ4 → **~3.6** · Near |

### O8 — Workforce Passport & Academy
| Field | Finding |
|-------|---------|
| Existing | Academy enroll; WorkerTrainingCompletion; WorkerCompetencyEvidence; QMS training distinct |
| Product | **Academy→Competency adapter** — completion proposes pending evidence; only humans verify |
| Complexity | **M** |
| Scores | PV4 SI5 RU4 SD4 CV4 IC3 DR4 EQ4 → **~4.0** · Near |

### O9 — Accessibility Evidence Graph
| Field | Finding |
|-------|---------|
| Existing | Access confidence ladder; property/vehicle evidence with provenance; CareOS read-access tool |
| Product | **Unified Access Evidence Graph** with provenance classes; ratings ≠ verified |
| Complexity | **L** |
| Scores | PV5 SI4 RU2 SD5 CV3 IC2 DR4 EQ5 → **~3.8** · Near |

### O10 — Support at Home & lifespan
| Field | Finding |
|-------|---------|
| Existing | Home Living profile; Support Profile; SC OS; `aged_care` funding enum unused |
| Driver | Support at Home live from Nov 2025; digital uplift ongoing; CHSP transition ≥2027 |
| Product | Lifespan coordination + **YPIRAC caution**; human assessors only |
| Complexity | **L** |
| Scores | PV5 SI5 RU3 SD4 CV4 IC2 DR3 EQ3 → **~3.6** · Near–Longer |

Sources: [Support at Home](https://www.health.gov.au/our-work/support-at-home); [aged care digital reform](https://www.health.gov.au/our-work/aged-care-reforms/aged-care-digital-reform).

### O11 — Smart-home / AT gateway
| Field | Finding |
|-------|---------|
| Existing | Revocable `HealthDeviceImport`; robotics simulation-only; equipment evidence; VR marketing-only |
| Product | Observe/notify gateway; **never actuate**; pathway-only emergency routing |
| Complexity | **L→XL** (actuators forbidden permanently) |
| Scores | PV3 SI5 RU1 SD4 CV3 IC2 DR3 EQ3 → **~3.0** · Longer / Research |

### O12 — White-label & enterprise
| Field | Finding |
|-------|---------|
| Existing | Tenant/Org; enterprise & government portals (thin); developer platform APIs/webhooks; federation |
| Product | White-label CareOS + **mandatory tenant context**; no silent cross-tenant |
| Complexity | **L** |
| Scores | PV3 SI4 RU3 SD3 CV5 IC2 DR3 EQ4 → **~3.4** · Near |

---

## Ranked top ten (by composite)

| Rank | ID | Opportunity | Horizon | Composite |
|------|-----|-------------|---------|-----------|
| 1 | O2 | NDIS digital-platform registration readiness | Immediate | ~4.3 |
| 2 | O5 | Consent & credential wallet | Near | ~4.0 |
| 3 | O8 | Workforce Passport / Academy adapter | Near | ~4.0 |
| 4 | O1 | Architecture & schema convergence | Immediate | ~3.9 |
| 5 | O6 | AI assurance / safety gate | Immediate | ~3.8 |
| 6 | O3 | Cross-scheme / foundational coordination | Near | ~3.8 |
| 7 | O9 | Accessibility Evidence Graph | Near | ~3.8 |
| 8 | O7 | Thin-market continuity | Near | ~3.6 |
| 9 | O10 | Support at Home / lifespan | Near–Longer | ~3.6 |
| 10 | O12 | White-label / tenancy hardening | Near | ~3.4 |

*(O4 FHIR and O11 AT gateway rank just below top ten but remain on roadmap.)*

## Explicitly not recommended
- Parallel “CareOS Core 2” or second mission bus  
- Automated eligibility, payment, claim, diagnosis, safeguarding conclusions  
- Participant risk/worthiness or productivity scores  
- Silent worker/provider substitution  
- Actuating physical equipment from CareOS  
- My Health Record write adapters without a dedicated regulated programme  

## Related operational completion (from platform audit)
Marketplace disclosure→agreement→booking, AbilityPay portals, outbox relay, and notification cloud are **completion debt**, not new product bets — sequence them with O1/O2.
