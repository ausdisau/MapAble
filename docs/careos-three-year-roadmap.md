# CareOS three-year roadmap

**Base:** `agent/careos-national-platform`  
**Constraint:** Research / planning only — no new broad feature phase in this document.

Horizons use product readiness, not calendar guesses for team size.

---

## Horizon map

| Horizon | Window | Theme |
|---------|--------|--------|
| Immediate | 0–6 months | Lawful operation + authority spine + workforce readiness |
| Near term | 6–18 months | Participant control surfaces + multi-scheme proof + Access/Academy bridges |
| Longer term | 18–36 months | Thin-market / lifespan / FHIR depth |
| Research | 3+ years | AT gateway actuation, full white-label marketplace OS, generative clinical agents |

---

## Immediate (0–6 months)

### Programme sequence

1. **Close platform completion (Wave 0–1)** already in flight on `agent/careos-platform-completion` — mission SoR, adapters, CI migrate path — *dependency for everything else*.
2. **O2 — NDIS digital-platform registration pack** (highest regulatory urgency).
3. **O1 — Schema convergence gate** merge + tip alignment so product code stops forking.
4. **O5 slice 1 — Preferential consent receipts** wired to existing Grant/Decision/Access/Comms paths.
5. **O6 — Safety gate CI job** with fail-closed fixture suite (leverages Phase 14 harness).

### Exit criteria (Immediate)

- Registration dossier reviewed by legal/compliance with named gaps closed or risk-accepted.
- Tip and completion share one mission client API; fabric quarantine empty or archived.
- At least one production path requires signed PreferenceReceipt before disclosure.
- CI fails on any PR that introduces a prohibited decision-automaton string in CareOS packages (heuristic + review).

### Must not ship in Immediate

- Automated claim approval, eligibility engines, risk scores, AT device command APIs in production, full white-label tenants.

---

## Near term (6–18 months)

1. **O8 — Workforce Passport integration** with Academy → Jobs → Quality attestation flow.
2. **O7 — Foundational Supports / scheme routing** with participant-visible explanations (no eligibility).
3. **O3 — Accessibility Evidence Graph** release as read API for Access + Transport + Mark.
4. **O9 — Thin-market continuity kit** pilot region.
5. **O4 — FHIR care-plan export** (export-first) under participant consent.
6. **O10 — Support at Home liaison** pilot (documentation + routing UX only).

### Exit criteria (Near term)

- Passport verification usable in Jobs match transparency without auto-hire.
- Cross-scheme journey demonstrated end-to-end with human scheme decisions.
- Evidence Graph powers Access Mark without parallel graph stores.
- One thin-market LGA shows measured continuity recovery time improvement under human confirmation rules.
- FHIR Bundle export accepted by at least one partner sandbox.

---

## Longer term (18–36 months)

1. Deepen **Support at Home / lifespan** product (still no SAH eligibility automation).
2. **Enterprise B2B** governed analytics + white-label readiness for allied partners (not marketplace OS clone).
3. Expand Evidence Graph into research-ready (governed) datasets via existing Analytics domain.
4. Regional federation realism (OpenTofu multi-state) if customers demand it.
5. Controlled **AT gateway research** with labs / universities — no production home actuation.

### Exit criteria (Longer term)

- Commercial packaging for “CareOS Core + Partner verticals” clear.
- Lifespan journey covers NDIS ↔ Aged Care handoff documentation without scoring people.
- Federation drills documented with RTO evidence.

---

## Research horizon (3+ years)

| Topic | Why deferred |
|-------|----------------|
| Smart-home / AT actuation gateway | Safety / physical harm / liability |
| Autonomous matching / predictive funding | Explicit product prohibition |
| Unregulated MHR write without national programme | Policy external |
| Generative clinical decision support | Safety boundary — diagnosis/treatment |
| “Another CareOS Core” rewrite | Architectural non-negotiable |

Keep research as docs + optional PoC schemas only until safety and participant-authority boards green-light.

---

## Dependency / branch strategy

```
main
 └─ … historical CareOS stack …
     └─ agent/careos-national-platform     ← programme tip (Phase 15)
         ├─ agent/careos-platform-completion ← converge + infra adapters
         └─ agent/careos-opportunity-portfolio ← this docs-only branch
```

**Product execution order after research approval:**

1. Land completion → national tip.  
2. Branch `agent/careos-ndis-platform-reg` from tip (O2).  
3. Branch `agent/careos-consent-wallet` for O5 (depends O1 done).  
4. Parallel research spikes only behind feature flags; no second mission table.

Avoid stacking more long-lived `agent/careos-*` phases without completing the tip merge. Prefer short-lived feature branches with Conventional Commits and migration deploy in CI.

---

## Capacity heuristic (complexity units)

| Horizon | Suggested focus units |
|---------|------------------------|
| Immediate | O2 + O1 + O5.s1 + O6 + completion finish |
| Near term | O8 + O7 + O3 + O9 pilot + O4 export |
| Longer | O10 depth + enterprise packaging + federation |

Do not run all twelve opportunity builds in parallel engineering tracks.
