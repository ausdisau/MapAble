# MapAble Navigator — Phase 4 Assurance Record

**Branch programme:** Governed Navigator pilot under freeze waiver **W-AA-1**  
**Production flags:** all `MAPABLE_NAVIGATOR_PILOT_*` remain default **false**  
**Public claims:** `not_claimable` — do not describe as production-ready, NDIS-compliant, or accredited from this work  
**Synthetic data only** in tests, evals, screenshots, and demos

---

## 1. Delivery status

| Phase                 | Exit gate                                                   | Status                                                                                                                                           |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 Inspection          | Report reviewed; continue vs supersede #472 decided         | **Complete** — continue on `cursor/navigator-governed-pilot-fedd`                                                                                |
| 1 Enforcement         | Tenant/consent/purpose/tool isolation; flags default off    | **Complete** — `tests/navigator/phase1-foundation.test.ts`, A2H hardening                                                                        |
| 2 Participant control | Keyboard/SR path for correct, refuse, opt-out, human help   | **Complete (code)** — lived-experience review still required                                                                                     |
| 3 Bounded Navigator   | No autonomous booking/sensitive disclosure                  | **Complete (code)** — deterministic match + draft envelopes only                                                                                 |
| 4 Assurance           | Owners approve synthetic/authorised pilot; flags off        | **This document** — checklist below; production enablement **out of scope**                                                                      |
| 5 Vertical slice      | Journey UI + Finder transfer + non-negotiables + draft edit | **Complete (code)** — `NavigatorPilotJourney`, `finder-transfer.ts`, `tests/navigator/phase5-vertical-slice.test.ts`; human gates still deferred |

---

## 2. Evidence ledger (claim statuses)

| Claim                                                                              | Status                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Capability registry + Navigator keys + ARC sidecar (classification only)           | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Purpose consent gate + draft-only envelopes + A2H tenant fields                    | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Decision Passport projection + governed memory + escalation                        | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Deterministic hard-constraint match + preference rank + orchestrator               | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Accessible Decision Passport UI shell                                              | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Participant journey UI (goal → confirm → constraints → shortlist → draft → Finder) | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Approved filter transfer to Provider Finder (`executionResult.finderPath`)         | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Non-negotiable hard-constraint keys on match + passport                            | IMPLEMENTED_NOT_PRODUCTION_VERIFIED                                            |
| Lived-experience accessibility acceptance                                          | DOCUMENTED_INTENT — manual matrix still `NOT_RUN`                              |
| Dignity-of-Risk kernel (full Autonomy Assurance Prompt 3)                          | DOCUMENTED_INTENT — least-restrictive notes recorded; kernel not a separate OS |
| Production Navigator enablement / partner integrations                             | HISTORICAL / EXPLORATORY — not claimed                                         |
| VERIFIED_LIVE production Navigator                                                 | **Not claimed**                                                                |

---

## 3. Security / privacy / consent controls added

- Server-side capability gate (`assertNavigatorCapability`) with flag + kill-switch recheck
- Purpose consent verification before protected actions (`verifyPurposeConsent`)
- Delegation distinguished from ownership
- Envelope v2: nonce, expiry, replay protection; model cannot approve
- A2H list/get/resolve tenant + assignee checks
- Passport/memory/escalation IDOR checks (tenant + participant)
- Matching never relaxes hard constraints; `NO_SAFE_MATCH` explicit
- Sponsored placement labelled; never alters eligibility
- Permanent prohibition list executable in tests
- Prompt-injection-resistant listing sanitisation in search tool
- Audit events on gate/consent/envelope/passport/memory/escalation paths

---

## 4. Accessibility outcomes

| Criterion                                        | Outcome                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| WCAG 2.2 AA target                               | Repository convention retained                                          |
| Keyboard / focus / live region on Passport panel | Implemented in UI shell                                                 |
| Non-AI equivalent path                           | Opt-out → `/provider-finder`                                            |
| Automated a11y                                   | Existing Playwright axe suite; Navigator-specific journey not yet in CI |
| Lived-experience / switch / AAC                  | **Required before any flag enablement** — owner action                  |

---

## 5. Threat-model outcomes (Navigator)

See also [`THREAT_MODEL.md`](./THREAT_MODEL.md) and Phase 0 matrix.

Residual risks (accepted for synthetic pilot only):

1. Public Provider Finder chat remains ungated by design — governed surface is `/api/navigator/pilot/*` only.
2. In-memory IP rate limits — not distributed; sensitive pilot mutations stay blocked until store approved.
3. Dual `participant-authority` writers — programmes write path must stay frozen for Passport enablement.
4. Vercel account / preview evidence may be unavailable — do not claim live preview proof.

---

## 6. DPIA / privacy notes (draft)

- Purpose limitation: `navigator.provider_search` only
- Data minimisation: structured filters + shortlist factors; no full history in prompts by default
- Retention: memory items require expiry/withdrawal/deletion paths; free-form chat memory not stored
- Cross-border / model region: respect gateway regional config when model-assisted flag is ever enabled
- Legal basis / role of MapAble as marketplace vs information service: **owner decision still open**

---

## 7. Dignity of risk / least-restrictive alternative

- Hard constraints encode participant exclusions and essential access needs — not inferred incapacity
- `NO_SAFE_MATCH` preferred over relaxing safety/access/credential constraints
- Human escalation available without penalty
- AI opt-out preserves classic Finder access
- No capacity, desirability, or complaint-likelihood scoring

Full Autonomy Assurance Dignity-of-Risk Kernel remains a follow-on under W-AA-1 Train A.

---

## 8. Monitoring, incident response, rollback

### Monitoring (when a controlled tenant enables flags)

- Audit query by `navigator.*` actions
- Kill switch: `MAPABLE_AI_GLOBAL_KILL_SWITCH` or capability kill keys
- Feature flags re-checked mid-flow

### Incident response

1. Engage global or capability kill switch
2. Disable `MAPABLE_NAVIGATOR_PILOT_ENABLED`
3. Preserve audit + envelopes (do not purge)
4. Follow [`../operations/INCIDENT_RESPONSE.md`](../operations/INCIDENT_RESPONSE.md)
5. Do not let models adjudicate reportability

### Rollback

1. Keep / set all `MAPABLE_NAVIGATOR_PILOT_*` to unset/false
2. Engage kill switches if in-flight model calls
3. Additive migrations may remain; reverse only on non-prod if required
4. Drafts, consent records, and audit events must remain consistent

See also [`ROLLBACK.md`](./ROLLBACK.md).

---

## 9. Controlled-pilot checklist (flags stay off until signed)

| #   | Check                                                           | Owner         | Done |
| --- | --------------------------------------------------------------- | ------------- | ---- |
| 1   | W-AA-1 still active; no second consent/audit OS                 | Product + Eng |      |
| 2   | Dual authority writer freeze confirmed                          | Eng           |      |
| 3   | Synthetic-only fixtures; no real participant data               | Eng           |      |
| 4   | Security tests green for Navigator suites                       | Eng           |      |
| 5   | Manual a11y matrix for Navigator journeys                       | A11y lead     |      |
| 6   | Lived-experience review scheduled/complete                      | Community     |      |
| 7   | Escalation / safeguarding operational owners named              | Ops           |      |
| 8   | NDIS Commission pages re-verified for policy refs               | Compliance    |      |
| 9   | Kill switch drill completed                                     | Eng + Ops     |      |
| 10  | Production flags remain false unless explicit enablement ticket | Release       |      |

**Named owners must approve** any synthetic-data or authorised pilot. This change does **not** enable production flags.

---

## 10. Unresolved human decisions

- Operational ownership for complaints, incidents, safeguarding escalation
- Legal role clarification (marketplace vs information service) for COI disclosures
- Distributed rate-limit store approval
- Whether to close superseding draft PR #472 after this branch merges
- Current official NDIS Commission page verification (fetch failed during Phase 0)

---

## 11. Test & eval commands

```bash
pnpm exec vitest run tests/navigator tests/act/a2h-tenant-hardening.test.ts
pnpm test:ai-platform
pnpm ai:evals
pnpm type-check
pnpm ci:production-claims
```

Navigator eval scenarios: tags `navigator` in `lib/ai/platform/evaluations/scenarios/catalog.ts`.
