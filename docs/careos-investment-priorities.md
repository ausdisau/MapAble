# CareOS investment priorities

**Companion docs:** `careos-opportunity-portfolio.md` · `careos-three-year-roadmap.md` · `careos-platform-gap-analysis.md`  
**Principle:** Invest to deepen the **canonical CareOS mission + event spine** — never fund a parallel Core.

---

## 1. Scoring rubric (how money follows evidence)

Use portfolio dimensions (PV, SI, RU, SD, CV, IC↑=easy, DR, EQ).  
**Invest when:** RU ≥4 or (PV≥4 ∧ SI≥4) with DR≥3.  
**Defer when:** Requires forbidden automation, physical actuation, or unregulated clinical write paths.

---

## 2. Top three strategic bets

| Bet | Opportunity | Why this bet | What we fund | What we refuse to fund |
|-----|-------------|--------------|--------------|------------------------|
| **A — Licence to operate** | O2 (+ completion) | Digital platform providers face **mandatory registration from 1 Jul 2026**; without a pack + QMS evidence MapAble cannot reliably commercialise marketplace SKUs | Registration readiness product, audit export, screening evidence index, legal liaison | Automated claim/payment bots as a “shortcut” to compliance |
| **B — Participant authority plane** | O5 (+ O1 spine) | Grants/receipts exist but participants lack a durable wallet; this is differentiation competitors copy poorly if ethics-bound | Consent & credential wallet MVP, preferential receipts on disclosure | Ranking participants, silent grant inheritance to finance/clinical |
| **C — Trust of labour** | O8 (+ O6 gate) | Academy and competency evidence are adjacent but not joined; Commission worker/platform obligations increase scrutiny | Academy→pending competency adapter; safety evaluation CI gate | Auto-verified workers, auto-assign of workers to participants |

All three bets **depend on O1 convergence** landing with the tip — treat O1 as **capital infrastructure**, not optional R&D.

---

## 3. Ranked investment table (36 months)

| Rank | ID | Horizon | Complexity | Invest posture | Rationale |
|------|-----|---------|------------|----------------|-----------|
| 1 | O2 | Immediate | M | **Fund now** | Regulatory deadline / operate-to-market |
| 2 | O1 | Immediate | L | **Fund now** (infra) | Unblocks safe product delivery |
| 3 | O5 | Imm→Near | M | **Fund after O1 slice** | Highest PV×SI among product surfaces |
| 4 | O6 | Immediate | M | **Fund with AI paths** | Cheap relative to liability of silent AI drift |
| 5 | O8 | Near | M | **Fund** | Strategic bet C + commercial training SKU |
| 6 | O3 | Near | L | **Fund selectively** | Foundational Supports Agreement 2026–31 positioning |
| 7 | O9 | Near | L | **Fund after Access reuse map** | Defensible data asset; maps to Mark/Transport |
| 8 | O7 | Near | L | **Pilot fund** | Thin-market social licence; conflict with scoring must be fixed first |
| 9 | O10 | Near–Long | L | **Pilot fund** | Support at Home adjacency; no SAH eligibility engine |
| 10 | O12 | Near | L | **Package after tenancy hardening** | CV high but safety of cross-tenant is prerequisite |
| 11 | O4 | Near | M | **Partner-funded export** | Export-first FHIR; MHR deferred |
| 12 | O11 | Research | L→XL | **Lab only** | Observe/notify sketches; **no actuation budget** |

---

## 4. Recommended programme sequence (delivery order)

1. **Finish platform completion** (mission SoR, adapters, migrate deploy) → merge to tip.  
2. **O2 registration pack** (parallel legal + eng).  
3. **O1 remaining convergence gate** (flags, intel trees, empty quarantine).  
4. **O6 safety gate** in CareOS CI (cheap insurance during parallel feature work).  
5. **O5 wallet** preferential receipts → full issue/revoke.  
6. **O8 Academy adapter**.  
7. **O3 / O9 / O7** as coordinated near-term wave (shared mission tags + evidence reads).  
8. **O4 export** and **O10 liaison** under partner pilots.  
9. **O12** packaging once tenant context + audit trails proven.  
10. Keep **O11** in research portfolio with explicit kill-switch for actuation ideas.

---

## 5. Commercial pathways (aligned with doctrine)

| Pathway | Linked opps | Monetisation | Guardrail |
|---------|-------------|--------------|-----------|
| Marketplace licence to operate | O2, O1 | Subscription / SaaS for providers on registered platform | Claim flags remain human-gated |
| Authority / privacy premium | O5 | Participant plan features; org compliance add-on | Never sell access profiles without consent |
| Workforce trust services | O8, O6 | Academy + verified evidence workflows for providers | Humans verify competency |
| Coordination / multi-scheme | O3, O10 | SC OS seats; aged-care liaison partners | No automated eligibility |
| Evidence / Access data products | O9 | Mark, enterprise Access APIs | Ratings ≠ verified; unknown stays unknown |
| Enterprise / white-label | O12 | B2B tenancy + developer platform | Mandatory tenant isolation |
| Health partner export | O4 | Integration fees | Read/export under consent only |

Do **not** invent revenue from risk scores, automated claims, or “AI that decides care.”

---

## 6. Pilot opportunities (near-term, low blast radius)

| Pilot | Opps | Success signal | Non-goals |
|-------|------|----------------|-----------|
| Registration dossier dry-run with 1–2 providers | O2 | Human-usable pack for mock Commission checklist | Live claim submit |
| PreferenceReceipt on one disclosure path | O5 | Auditable revoke within session/day | Replace NextAuth |
| Academy completion → pending competency | O8 | Evidence stays pending until human | Auto-hire |
| Thin-market LGA continuity kit | O7 | Faster recovery under human confirmation | Participant scoring |
| FHIR Appointment/CarePlan export sandbox | O4 | Partner accepts Bundle | MHR write |
| Support at Home liaison script in SC | O10 | Clear handoff docs; YPIRAC caution shown | SAH eligibility automation |

---

## 7. Capital allocation heuristic

| Bucket | Share of next engineering capacity | Notes |
|--------|-------------------------------------|-------|
| Infra / completion / O1 | ~25% | Without this, product bets rot |
| Licence (O2) + safety (O6) | ~25% | External risk |
| Authority + labour trust (O5, O8) | ~25% | Strategic differentiation |
| Near-term product wave (O3, O7, O9) | ~15% | After spine stable |
| Pilots / partners (O4, O10, O12 start) | ~10% | Contained |
| Research (O11+) | Cap ≤5% docs/PoC | No runtime |

---

## 8. Explicitly deferred (do not fund)

- Parallel CareOS Core / second mission bus  
- Automated eligibility, diagnosis, treatment, payment, claim, or provider selection engines  
- Participant risk / worthiness / productivity scores  
- Physical smart-home / AT actuation APIs  
- Unregulated My Health Record write adapters  
- Silent worker or provider substitution  

---

## 9. Dependencies & branch strategy (investment lens)

```
agent/careos-national-platform          ← tip / merge target
 ├─ agent/careos-platform-completion    ← fund to land first
 └─ agent/careos-opportunity-portfolio  ← docs only (this research)
```

**Post-approval feature funding:**

| Order | Branch (suggested) | Invests |
|-------|--------------------|---------|
| 1 | land completion → tip | SoR |
| 2 | `agent/careos-ndis-platform-reg` | O2 |
| 3 | `agent/careos-consent-wallet` | O5 (after O1) |
| 4 | `agent/careos-safety-gate` | O6 |
| 5 | `agent/careos-workforce-passport` | O8 |

Prefer short-lived branches; avoid another 10-deep `agent/careos-*` stack before tip consolidation.
