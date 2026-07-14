# CareOS platform gap analysis

**Inspected tip:** `agent/careos-national-platform`  
**Companion streams:** Portfolio O1–O12 · completion branch dependency  
**Mode:** Evidence-backed gaps only — no production code changed

---

## 1. Maturity snapshot

| Layer | Maturity | Evidence |
|-------|----------|----------|
| Domain breadth (Phases 6–15) | **High surface, uneven depth** | Identity, SC, Transport, Moves, Jobs, Quality, Developer platform, Mobile/AAC, Analytics, National infra scaffolds present in schema + services |
| Canonical mission spine | **Fragile / dual heritage** | Tip `CareOSMission` (`missionType`/`inputSummary`) vs quarantined fabric shape (`goal`/`modules`/`graphJson`) under `docs/merge-pending/mapable-intelligence-fabric/` |
| Authority & consent | **Strong primitives, weak control plane** | `AuthorityDecision`, `ConsentRecord`, `ConsentReceipt`, grants — not yet a participant-facing wallet over time |
| NDIS integration | **Prepare-mode advanced; operate-mode locked** | `NdiaApiReadinessChecklist`, claim evidence bundles, adapter configs; claim automation hard-off by design |
| Access evidence | **Distributed, high quality locally** | Access confidence ladder, property/vehicle evidence provenance; no single Evidence Graph API |
| AI / safety | **Harness exists; gate incomplete** | Evaluation scenarios + prohibited uses; CareOS CI does not fully enforce harness as merge gate |
| Multi-scheme / aged care | **Enums without product** | `aged_care` / grant funding paths; Support at Home / foundational supports lack first-class UX |
| Tenancy / white-label | **Foundational** | Org/tenant models + thin enterprise portals; not production white-label OS |
| Ops / cloud | **Scaffolded** | Terraform/OpenTofu, outbox, federation stubs; completion debt on durable relay & staging smoke |

**Verdict:** CareOS is a **broad, doctrine-aligned platform tip** with real domain models — not a greenfield. The critical gap is **consolidation and lawful readiness**, not inventing another Core.

---

## 2. Architecture blockers

| Blocker | Impact | Related opp |
|---------|--------|-------------|
| **B1 Dual mission schemas** | Risk of undeclared columns, split event identity, broken `linkedMissionId` graphs | O1 |
| **B2 Dual intelligence trees** | `intelligence/` vs `lib/intelligence/careos/` drift; duplicate flags/prohibited registries | O1, O6 |
| **B3 Matching vs marketplace fairness conflict** | Factor scores in matching clash with “no best ranking / unknown stays unknown” | O7 |
| **B4 Incomplete outbox / event relay** | Mission + domain events may not fan out reliably without completion adapters | Completion + O1 |
| **B5 Parallel NDIA readiness vs claim pathways** | Confusion between registration evidence and claim submit surfaces | O2 |
| **B6 Cross-domain IDs without Evidence Graph** | Access/Transport/Mark disagree on confidence provenance | O9 |
| **B7 Academy ≠ Workforce competency SoR** | Training completion not automatically (and must never auto-verify as) Passport evidence | O8 |
| **B8 Long agent-branch stack** | Multiple `agent/careos-*` PRs increase merge conflict / SoR drift risk | Roadmap branch strategy |

---

## 3. Capability vs need matrix (by research stream)

### Architecture & schema (O1)
| Existing | Duplicate / conflict | Gap |
|----------|----------------------|-----|
| Tip CareOS mission + recommendations/evidence/activity | Fabric quarantine + `$executeRaw` heritage | Single SoR + Prisma-only persistence + unified flags |

### NDIS digital-platform registration (O2)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Readiness checklist, QMS/quality accreditation, screening pathways | Readiness docs vs claim dry-run adapters | **Human registration dossier** mapped to Commission platform-provider rules from Jul 2026 |

### Cross-scheme / foundational (O3)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Funding enums; SC OS; Home Living | Dual taxonomies | Foundational Supports navigation without eligibility engines |

### Health / FHIR (O4)
| Existing | Conflict | Gap |
|----------|----------|-----|
| FHIR sync stubs; Moves clinical hard-offs | Stub sync vs production clinical temptation | Consent-gated **read/export** only; MHR programme deferred |

### Consent wallet (O5)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Grants, receipts, privacy UI, passkeys | Login credentials ≠ data wallet | Time-bound issue/revoke UX; preferential receipt on disclosure paths |

### AI assurance (O6)
| Existing | Conflict | Gap |
|----------|----------|-----|
| 9-scenario harness; dual prohibited lists | Lists not unified; harness not always in CareOS CI | Signed safety gate blocking AI-path regressions |

### Thin-market (O7)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Continuity recovery; capacity honesty; federation | Matching score factors | Continuity kit with Available/Limited/Unknown/Escalate — **no participant scores** |

### Workforce Passport / Academy (O8)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Academy enrol; `WorkerCompetencyEvidence`; QMS training | Distinct training stores | Adapter: completion → **pending** evidence; humans verify |

### Accessibility Evidence Graph (O9)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Access confidence; property/vehicle evidence; Mark | Multiple confidence stores | Unified graph API; ratings ≠ verified |

### Support at Home / lifespan (O10)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Home Living; Support Profile; `aged_care` enum | Aged care unused | Lifespan coordination docs + YPIRAC caution; human assessors only |

### Smart-home / AT (O11)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Revocable device import; simulation robotics | Marketing VR vs real AT | Observe/notify only; **actuation permanently out of scope** |

### White-label / enterprise (O12)
| Existing | Conflict | Gap |
|----------|----------|-----|
| Tenants; developer APIs; thin portals | Cross-tenant leakage risk | Mandatory tenant context; packaging — not a second marketplace Core |

---

## 4. Safety & doctrine gaps (must stay closed)

These are **intentional non-features**, not backlog items:

- Automated eligibility, diagnosis/treatment, payment/claim decisions  
- Participant risk / worthiness / productivity scores  
- Autonomous provider or worker selection  
- Physical AT actuation from CareOS  
- Parallel CareOS Core rewrite  

Any “gap” that would reopen these is a **product rejection**, not a maturity gap.

---

## 5. Accessibility requirements debt

| Area | Current | Needed |
|------|---------|--------|
| AAC / mobile | Passport + offline scaffolds | Continuous WCAG verification in release path |
| Voice / confirmation | Confirmation-bound voice patterns | Extend to wallet + registration admin UX |
| Evidence presentation | Confidence ladder with unknown | Graph UI must never promote unverified → verified |

---

## 6. Operational gaps

- Staging smoke / RTO evidence packs incomplete  
- Event relay / notification cloud still completion debt  
- Registration evidence export not productised for Commission pack  
- Federation drills exist as stubs more than runbooks  

---

## 7. Gap → investment mapping

| Priority band | Close these gaps first |
|---------------|------------------------|
| P0 | B1/B2 (O1), registration dossier (O2), completion adapters |
| P1 | Consent control plane (O5), safety CI gate (O6), Academy adapter (O8) |
| P2 | Foundational routing (O3), Evidence Graph (O9), thin-market kit (O7) |
| P3 | FHIR export (O4), Support at Home depth (O10), white-label (O12) |
| Research | AT observe-only sketches (O11); never actuators |

Detail: `docs/careos-investment-priorities.md` · sequencing: `docs/careos-three-year-roadmap.md`.
