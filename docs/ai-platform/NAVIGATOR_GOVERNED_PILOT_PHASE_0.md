# MapAble Navigator — Governed Pilot Phase 0 (Inspection & Plan)

**Mode:** documentation only (no runtime / schema changes in this artefact)  
**Repository:** `ausdisau/mapableau-new`  
**Inspection tip:** `20bdebea` (`main` at Phase 0)  
**Autonomy Assurance baseline (Prompt 0):** `dd5ff9fc` — see [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)  
**Freeze posture:** Active feature freeze; product work requires waiver **W-AA-1** ([`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md))  
**Verdict:** **NARROW AND PROCEED** under W-AA-1 — do not start a parallel OS; assemble a governed vertical slice on existing canonical modules.

---

## 1. Repository findings (with file paths)

### 1.1 Instructions and entry points

| Finding              | Path                                                  | Note                                                                       |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| No root `AGENTS.md`  | —                                                     | Instructions live in `README.md`, `docs/ai-platform/*`, `.cursor/rules/*`  |
| Package / scripts    | `package.json`                                        | Next 15, Prisma 6, Vitest, Playwright a11y; `test:ai-platform`, `ai:evals` |
| Prisma SoT           | `prisma/schema.prisma` (+ `prisma/migrations/`)       | Multi-domain; additive migrations preferred                                |
| Provider Finder chat | `app/api/provider-finder/chat/route.ts`               | IP rate limit only; **no** auth/consent/capability gate                    |
| Finder orchestration | `lib/provider/finder/ask-bridge.ts`, `conversation/*` | NL → filters → NDIS search                                                 |
| Ephemeral sessions   | `lib/ai/agent-sessions/provider-finder-session.ts`    | In-memory `Map`, TTL ~1h; no tenant/participant scope                      |

### 1.2 AI platform and autonomy assurance

| Concern                | Canonical path                                              | Status                                                                            |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Capability registry    | `lib/ai/platform/capabilities/{types,seed,registry}.ts`     | Metadata + `requireAiCapability`; honesty gap for `agent.aura_*` keys             |
| Kill switches          | `lib/ai/platform/policies/kill-switches.ts`                 | Runtime `assertModelCallAllowed`                                                  |
| Model gateway          | `lib/ai/platform/models/gateway.ts`                         | Allowlist + capability resolution                                                 |
| Human-review contracts | `lib/ai/platform/human-review/contracts.ts`                 | Types; not a full workflow engine                                                 |
| Evaluations            | `lib/ai/platform/evaluations/**`                            | Harness with accessibility dimension                                              |
| Current-state table    | `docs/ai-platform/CURRENT_STATE.md`                         | Registry honesty gap documented                                                   |
| DoD                    | `docs/ai-platform/AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md` | ARC, Dignity-of-Risk, Decision Passport, Envelope v2, governed memory **not met** |
| LLM training spec      | `docs/llm/mapable-llm-spec.md`                              | Docs-only; no training code                                                       |
| AURA harness           | `lib/aura-harness/**`                                       | Flag default off; fingerprint memory can short-circuit eval                       |
| Deferred Agent OS      | `lib/aura/`                                                 | **Absent** on main — do not resurrect                                             |

### 1.3 Consent, authority, audit

| Concern                | Canonical path                                              | Prisma                                                                                                       |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Consent SoT            | `lib/consent/consent-service.ts`, `require-consent.ts`      | `ConsentRecord`                                                                                              |
| Consent receipts       | `lib/consent/consent-receipt-service.ts`                    | `ConsentReceipt` (scope/purpose/action; **missing** tenant, field lists, expiry/supersession on receipt row) |
| Micro-consent          | `lib/consent/micro-consent-service.ts`                      | Uses same consent stack                                                                                      |
| Authority grants       | `lib/authority/participant-authority-service.ts`            | `ParticipantAuthorityGrant`                                                                                  |
| **Second writer**      | `lib/programmes/authority/participant-authority-service.ts` | Same grant model — **collision** called out in Prompt 0                                                      |
| Delegation invites     | `lib/delegation/delegate-invitation-service.ts`             | `DelegateInvitation`                                                                                         |
| Audit                  | `lib/audit/audit-event-service.ts`                          | `AuditEvent`                                                                                                 |
| CareOS consent adapter | `lib/intelligence/careos/consent/**`                        | Maps scopes → platform consent                                                                               |

### 1.4 Action envelopes, escalation, matching, navigator naming

| Concern                       | Path                                                                   | Note                                                         |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| CareOS Action Envelope v1     | `intelligence/actions/action-envelope.ts`                              | Care/transport submit only; hash + expiry                    |
| CareOS receipts               | Prisma `CareOSActionReceipt`                                           | Claim/complete                                               |
| A2H handoff                   | `lib/act/handoff/**`, Prisma `ActHandoff`                              | No `tenantId`; IDOR gaps in DoD                              |
| Deterministic care matching   | `lib/matching/matching-service.ts`                                     | Capability `matching.care_rules`                             |
| AI matching overlay           | `lib/ai/matching/ai-match-service.ts`                                  | Flag off; honest null model scores                           |
| **Human** Navigator programme | `lib/programmes/navigator/**`, Prisma `NavigatorProfile`               | Profile search / assignment — **not** the AI Navigator pilot |
| Decision notices              | `lib/trust/fabric/decision-notice.ts`, `DecisionNoticeRecord`          | ≠ Decision Passport                                          |
| Communication Passport        | Dual: `lib/communication/**` + `lib/support/communication-passport/**` | Duplicate SoT risk                                           |
| Trust Passport                | `lib/trust/passport/**`                                                | Worker credentials                                           |

### 1.5 Parallel / non-canonical registries

| Registry                     | Path                                                                                             | Role                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| AI capability seed           | `lib/ai/platform/capabilities/seed.ts`                                                           | **Runtime** for model gateway |
| Convergence / productisation | `lib/platform/convergence-os/seed/capabilities.ts`, `docs/productisation/CAPABILITY_REGISTRY.md` | Honesty / ops mirror          |
| Intelligence kernel          | `packages/intelligence-kernel`                                                                   | Synthetic kernel registry     |

**Rule:** Extend AI platform seed + ARC sidecar for Navigator; do not create a fourth registry.

### 1.6 Drift since Autonomy Assurance Prompt 0

Prompt 0 locked `dd5ff9fc`. Tip is now `20bdebea` (Access Infrastructure ontology #470, GA4, Expo skills). No ownership change observed for consent, AURA, or capability registry paths, but **re-reconcile W-AA-1 stack** before Train A product PRs if Access Infrastructure migrations touch shared User/tenant surfaces.

---

## 2. Current-versus-target gap matrix

Legend: **IT** = implemented + tested · **II** = implemented incomplete · **DO** = docs/schema only · **MI** = missing · **DC** = duplicate/conflict · **BL** = security/a11y blocker

| Subsystem                           | Target (governed Navigator)                                  | Current                                     | Class                                                          | Evidence                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Capability registry metadata        | Full fields + version/consent/tools                          | Strong seed (`AiCapabilityRegistration`)    | **IT** / gap                                                   | Missing: version, consent scopes, approval expiry as first-class; `agent.aura_*` not seeded (**DO** honesty gap) |
| Registry **runtime** enforcement    | Reject undeclared caps/tools everywhere                      | Gateway + some agents only                  | **II** / **BL**                                                | Finder chat bypasses registry                                                                                    |
| Feature flags / kill switch         | Default-off + mid-flow recheck                               | Kill switches + many flag modules           | **IT** / **II**                                                | Not unified; Finder not gated                                                                                    |
| Consent grant/check                 | Purpose/field/action scoped                                  | `ConsentRecord` + `checkConsent`            | **II**                                                         | Field/action granularity uneven                                                                                  |
| Consent receipts                    | Immutable purpose receipts with tenant, expiry, supersession | `ConsentReceipt` thin row                   | **II**                                                         | No tenantId; no supersession fields on receipt                                                                   |
| Consent on every protected tool     | Mandatory pre-tool verify                                    | Not on Finder / most agent tools            | **BL**                                                         |                                                                                                                  |
| Delegation                          | Explicit, scoped, revocable, visible                         | Grants + invites tested                     | **IT** / **II**                                                | Dual authority writers (**DC**); not bound to Finder                                                             |
| Action envelopes                    | Signed, expiring, one-time, revalidate                       | CareOS v1 only                              | **II**                                                         | Governed Envelope v2 **MI**                                                                                      |
| Decision Passport                   | Participant-facing correction/challenge                      | **MI**                                      | Use `DecisionNoticeRecord` as projection input, not substitute |
| Deterministic hard-constraint match | Stage-1 hard filters never relaxed                           | Care matching exists; Finder is NL/hybrid   | **II**                                                         | Provider shortlist ≠ `runCareWorkerMatch`                                                                        |
| Preference ranking                  | Participant-controlled weights                               | Partial in matching / AI overlay            | **II**                                                         |                                                                                                                  |
| Governed memory                     | Approved categories only                                     | Fingerprint AURA memory + in-memory Finder  | **MI** / **BL**                                                | Memory can short-circuit AURA                                                                                    |
| Human escalation                    | Tenant-safe A2H                                              | `ActHandoff` partial                        | **II** / **BL**                                                | No tenantId; IDOR risk                                                                                           |
| Model gateway                       | Allowlist, schemas, redaction                                | Present                                     | **IT**                                                         | Migrate remaining call sites                                                                                     |
| ARC / Dignity-of-Risk / AURA v2     | Executable assessments                                       | **MI** (legacy AURA only)                   | Align to Autonomy Assurance Train A                            |
| Audit choreography                  | End-to-end AI action chain                                   | Fragmented domain auditors                  | **II**                                                         |                                                                                                                  |
| Accessibility journey               | WCAG 2.2 AA full Navigator path                              | UI prefs + eval dimension + Playwright a11y | **II**                                                         | AI streaming a11y incomplete                                                                                     |
| Equivalent non-AI path              | Opt-out to Provider Finder forms                             | Classic Finder UI exists                    | **IT** / **II**                                                | Not choreographed as explicit opt-out of AI                                                                      |
| Permanent prohibitions              | Executable tests                                             | Policy docs + some safety invariants        | **II**                                                         | Need Navigator-specific prohibition tests                                                                        |

---

## 3. Reuse-versus-create decisions

| Subsystem                            | Decision                                                                                                                                   | Rationale                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Capability registry                  | **Reuse / extend** `lib/ai/platform/capabilities/**` + ARC **sidecar**                                                                     | Canonical runtime; Prompt 0 forbids marketplace replacement                                     |
| Convergence capability seed          | **Leave as mirror**; do not dual-write runtime                                                                                             | Honesty inventory only                                                                          |
| Consent / receipts                   | **Reuse** `lib/consent/**`; **extend** receipt verification API                                                                            | Sole consent SoT                                                                                |
| Authority / delegation               | **Reuse** `lib/authority/**` + `lib/delegation/**`; **stop new writes** via programmes duplicate                                           | Resolve dual-writer before Passport                                                             |
| Action envelopes                     | **Extend** CareOS envelope pattern → Governed Envelope v2 under `intelligence/actions/` or `lib/ai/platform/envelopes/` attached carefully | Do not invent parallel ledger                                                                   |
| Decision Passport                    | **Create projection** over notices + match runs + envelopes; not a consent wallet                                                          | Prompt 0 / DoD #7                                                                               |
| Matching                             | **Reuse** deterministic matching patterns; **add** provider-outlet hard-constraint stage for Finder                                        | Do not let model rank past hard fails                                                           |
| Provider Finder chat                 | **Wrap** existing ask-bridge behind governance gates                                                                                       | Preserve NL UX; fail closed when flags off                                                      |
| Human Navigator (`NavigatorProfile`) | **Do not overload**                                                                                                                        | Keep human programme separate; name AI surface `mapable.navigator.provider_search` (or similar) |
| Memory                               | **Create** participant-scoped governed memory store; **harden** AURA fingerprint memory                                                    | Do not use free-form chat logs as memory                                                        |
| Escalation                           | **Harden** `lib/act/handoff/**`                                                                                                            | Add tenant/participant scoping                                                                  |
| Model gateway                        | **Reuse**                                                                                                                                  | Register Navigator capabilities only                                                            |
| Audit                                | **Reuse** `createAuditEvent` + Trust Fabric receipts/notices                                                                               | Choreograph; no second ledger                                                                   |
| AURA / ARC / Dignity-of-Risk         | **Follow** Autonomy Assurance Trains A–C                                                                                                   | Navigator pilot **consumes** these; does not fork them                                          |
| `lib/aura/` Agent OS                 | **Do not create**                                                                                                                          | Frozen / extract-only                                                                           |

**Stop-for-review triggers (duplicate canonical subsystem):**  
Any PR that adds a second consent table, a new “Navigator OS” top-level package, a second action-ledger, or merges #299/#311 wholesale.

---

## 4. Threat model and accessibility risks

### 4.1 Threats (Navigator-specific, extends `docs/ai-platform/THREAT_MODEL.md`)

| ID  | Threat                                              | Impact                                         | Mitigation plan                                                                                             |
| --- | --------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| T1  | Unauthenticated Finder chat + session fixation      | Cross-user session bleed; PII in ephemeral Map | Auth for governed pilot; tenant+participant-bound session IDs; no sensitive profile in unauthenticated path |
| T2  | Missing consent / overbroad delegate                | Unauthorised search of participant context     | Pre-tool `requireConsent` + grant field/action checks                                                       |
| T3  | IDOR on envelopes / handoffs                        | Cross-tenant disclosure                        | Tenant+participant predicates on every list/get/mutate                                                      |
| T4  | Envelope replay / stale approval                    | Unintended draft creation                      | Single-use nonce, expiry, revalidate identity/consent/flags                                                 |
| T5  | Prompt injection via provider text                  | Tool misuse / fabricated credentials           | Treat outlet data as untrusted; tool allowlist; schema-bound outputs; never trust model for credentials     |
| T6  | Model invents NDIS registration / clinical advice   | Harmful guidance                               | Deterministic credential filters; prohibition tests; escalation                                             |
| T7  | Kill switch / flag race mid-workflow                | Partial autonomous behaviour                   | Recheck flag+kill switch at envelope execute and each tool call                                             |
| T8  | AURA memory short-circuit                           | Bypass live consent/authority                  | Memory never replaces live checks (DoD #5)                                                                  |
| T9  | Safeguarding content visible to alleged perpetrator | Retaliation / privacy breach                   | Escalation confidentiality restrictions; role-based redaction                                               |
| T10 | Dual authority writers                              | Inconsistent grants                            | Single write path before pilot enablement                                                                   |

### 4.2 Accessibility risks

| Risk                                                 | Mitigation                                                                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Streaming chat announces every token                 | Accessible live region strategy; summarise turns; respect `prefers-reduced-motion` |
| AI-only path locks out AAC / switch / voice users    | Explicit non-AI Provider Finder continuation; save/resume; extra response time     |
| Decision Passport buried in dense prose              | Easy Read / simplified mode; keyboard-complete correction/challenge                |
| Supporter assists without distinguishable delegation | UI + server distinguish supporter vs participant; never silent consent             |
| Disability simulation as “testing”                   | Prohibit; require lived-experience review checklist (manual gate)                  |

---

## 5. Proposed schema and API changes (additive, flag-default-false)

> No migrations in Phase 0. Proposed for later phases under W-AA-1.

### 5.1 Schema (additive)

| Change                                                                                                                                                                     | Purpose                                                                                                          | Risk                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Capability ARC sidecar tables or versioned JSON artefacts (prefer code+tests first)                                                                                        | DoD #1–2                                                                                                         | Low if no runtime authority from ARC              |
| `GovernedActionEnvelope` (or extend `CareOSActionReceipt`)                                                                                                                 | Opaque id, tenant/participant/user/capability, payload hash, consentReceiptId, nonce, status, expiry, audit refs | Medium — choose attachment carefully vs CareOS v1 |
| Decision Passport projection tables **or** derived views over existing notices/match runs                                                                                  | Participant-facing passport                                                                                      | Low if projection-only                            |
| Governed memory items (`participantId`, `tenantId`, category enum, consentRef, expiry, provenance)                                                                         | Approved categories only                                                                                         | Medium — strict enums                             |
| `ActHandoff.tenantId` + `participantId` (+ indexes)                                                                                                                        | IDOR hardening                                                                                                   | Medium — backfill strategy                        |
| Consent receipt enrichment (`tenantId`, `permittedFields`, `permittedActions`, `policyVersion`, `withdrawnAt`, `supersededById`) **or** verify via join to `ConsentRecord` | Purpose-specific enforcement                                                                                     | Prefer join+API first to avoid second SoT         |

**Migration risk:** Prefer verify-via-`ConsentRecord` and projection-first Passport to minimise migrate-from-zero surface. Envelope v2 must not break CareOS prepare/execute contracts.

### 5.2 API surface (new, thin handlers)

| Endpoint (proposed)                                       | Behaviour                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| `POST /api/navigator/pilot/sessions`                      | Start governed session (auth, consent, capability flag)        |
| `POST /api/navigator/pilot/chat`                          | Wrapped Finder turn under registry + consent + tool allowlist  |
| `GET /api/navigator/pilot/passport/:id`                   | Decision Passport projection                                   |
| `PATCH /api/navigator/pilot/passport/:id`                 | Corrections, weight edits, constraint edits, reject suggestion |
| `POST /api/navigator/pilot/envelopes`                     | Create draft-only service-request envelope                     |
| `POST /api/navigator/pilot/envelopes/:id/approve\|reject` | Human/participant approval — **no** book/pay execute           |
| `POST /api/navigator/pilot/escalate`                      | Tenant-safe A2H                                                |
| `POST /api/navigator/pilot/opt-out`                       | Continue via classic Provider Finder                           |

Preserve existing `/api/provider-finder/chat` behaviour unless a documented security defect requires change; governed pilot uses **new** routes behind flags.

### 5.3 Capability keys (to register in seed)

- `navigator.provider_search.interpret` (hybrid, ceiling: recommend)
- `navigator.provider_search.reply` (model_backed, experimental)
- `navigator.provider_search.match` (**deterministic**)
- `navigator.provider_search.draft_service_request` (deterministic proposal only)
- `navigator.provider_search.escalate` (deterministic)

All flags default **false**; kill-switch keys required; tool allowlists empty except explicitly approved search tools.

---

## 6. Exact implementation phases

Aligned with user workstreams **and** Autonomy Assurance Trains (do not fork programme).

### Phase 1 — Enforcement foundation (Autonomy Assurance Train A + Envelope/A2H start)

1. Register Navigator + missing `agent.aura_*` capability keys; ARC sidecar (classification only — no runtime authority).
2. Runtime gate helper: `assertNavigatorCapability(ctx)` → capability + flag + kill switch + tool allowlist.
3. Consent verification wrapper for protected reads/tools (exists, tenant/participant, purpose/fields/action, not expired/withdrawn/superseded).
4. Delegation checks distinguishable from ownership.
5. Governed Action Envelope v2 (draft-only actions: `create_service_request_draft`, `transfer_filters_to_finder`).
6. Unified audit events for gate allow/deny, consent used/blocked, envelope lifecycle.
7. A2H tenant/participant hardening (no auto-execute).

**Out of scope:** Care booking, Transport dispatch, Jobs, invoicing, payments.

### Phase 2 — Participant control

1. Decision Passport projection + accessible UI.
2. Correction / challenge / opt-out / request human.
3. Governed memory (approved categories); AURA memory hardening.
4. Dignity-of-Risk / least-restrictive checks on mitigations (Train A Prompt 3).

### Phase 3 — Bounded Navigator pilot

1. Governed conversation over Finder interpret/search (flags off by default).
2. Stage-1 hard constraints on approved provider data; Stage-2 participant weights.
3. Explainable editable shortlist; no-match without relaxation.
4. Draft service request + filter transfer envelopes.
5. Escalation triggers (consent unclear, danger, no match, participant request, low confidence, prohibited topic).

### Phase 4 — Assurance

1. Security + a11y + eval suites (20 required scenarios).
2. ARC/AURA/DoR/privacy/a11y impact records per capability.
3. Runbooks + pilot checklist; public claims remain non-claimable.

**Stack rule:** ≤3 unmerged product PRs per train; do not attach to Geoscape W-GEO-1 stack.

---

## 7. Files expected to change (by phase)

### Phase 1 (illustrative)

- `lib/ai/platform/capabilities/seed.ts`, `types.ts`, `registry.ts` (+ ARC sidecar module)
- `lib/ai/platform/policies/kill-switches.ts` (if Navigator keys need helpers)
- `lib/consent/require-consent.ts` (+ new `verify-purpose-consent.ts` if needed)
- `lib/authority/participant-authority-service.ts` (read path only; programmes write freeze)
- `intelligence/actions/*` (Envelope v2) + Prisma migration
- `lib/act/handoff/service.ts` + Prisma `ActHandoff` fields
- `lib/audit/audit-event-service.ts` (event name constants)
- `app/api/navigator/pilot/**` (new)
- `tests/ai-platform/**`, `tests/navigator/**`, `tests/security/**`
- `docs/ai-platform/CURRENT_STATE.md`, capability docs

### Phase 2–3 (additional)

- `lib/navigator/**` or `lib/ai/navigator/**` (orchestration — thin)
- `lib/provider/finder/ask-bridge.ts` (optional adapter hooks; preserve default behaviour)
- `lib/matching/*` or `lib/navigator/matching/*` (provider hard constraints)
- `components/navigator/**`, Decision Passport UI
- `lib/aura-harness/memory-store.ts` (scoping)
- Accessibility components + Playwright journeys

### Explicit non-touch (this programme)

- Payments / AbilityPay / Stripe live config
- Care booking execute / Transport dispatch / Jobs orchestration
- `lib/aura/` Agent OS
- Wholesale #299 / #311

---

## 8. Test plan and commands

### Commands

```bash
pnpm type-check
pnpm lint
pnpm test:ai-platform
pnpm test -- tests/aura-harness tests/authority tests/act tests/careos-action-kernel
pnpm test -- tests/navigator   # once added
pnpm test:a11y                 # Playwright a11y for Navigator routes when present
pnpm ai:evals                  # capability evaluation suites
pnpm ci:production-claims
pnpm ci:feature-dependencies
```

### Required scenario coverage (Phases 1–4)

Map 1:1 to user testing requirements 1–20: consent expiry/withdraw/supersede; overbroad delegation; cross-tenant/participant; IDOR envelopes/handoffs; replay/expiry; permission change before execute; mid-flow kill switch; credential hallucination; prohibited tool; prompt injection; no-match; participant correction; stale evidence; AI opt-out; keyboard/SR; streaming announcements; AAC repair; timeout/resume; audit chain; model-provider fallback.

Use synthetic fixtures only.

---

## 9. Assumptions and blockers

### Assumptions

1. W-AA-1 remains the authorising freeze waiver for this work.
2. “MapAble Navigator” pilot ≠ human `NavigatorProfile` programme.
3. Provider Finder remains available as the equivalent non-AI path.
4. Pilot may create **drafts** only — never book/pay/change records/disclose sensitive data/determine eligibility/clinical/safeguarding.
5. Lived-experience testing is a human gate outside CI green.

### Blockers / review stops

| Blocker                                      | Action                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Dual `participant-authority` writers         | Designate single write path before Passport enablement                            |
| Communication Passport dual SoT              | Out of Navigator scope but avoid third passport                                   |
| `ActHandoff` without tenant                  | Must harden before escalation UI                                                  |
| Finder unauthenticated by design (marketing) | Governed pilot must be authenticated; do not silently change public chat contract |
| Feature freeze without W-AA-1 acceptance     | Docs-only; no product PRs                                                         |
| Stack depth / conflicting waived stacks      | Fresh ≤3 PR trains only                                                           |
| Claiming production readiness from code      | Forbidden (`ci:production-claims`)                                                |

---

## 10. Recommendation

**Narrow the slice and proceed** under W-AA-1:

1. **Do not** implement all ten workstreams in one change.
2. **First product PR after this Phase 0:** Phase 1 enforcement foundation only (registry enforcement for Navigator keys, consent gate, Envelope v2 draft-only, A2H tenant fields, audit events, prohibition tests) — flags default false.
3. **Defer** Care/Transport/Jobs/payments permanently for this pilot.
4. **Consume** Autonomy Assurance ARC / AURA v2 / Dignity-of-Risk rather than re-specifying them.
5. **Stop** if a PR introduces a second consent SoT, Agent OS (`lib/aura/`), or autonomous execute path.

**Phase 0 complete.** Await review before any runtime or schema edits.

---

## Phase 0 review decision (2026-08-11)

| Field          | Decision                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspection tip | `20bdebea` (`main`)                                                                                                                             |
| Overlap        | Draft PR [#472](https://github.com/ausdisau/mapableau-new/pull/472) already contained this Phase 0 artefact + Phase 1                           |
| Choice         | **Continue #472 work** on agent branch `cursor/navigator-governed-pilot-fedd` (preserves Phase 1; does **not** fork a parallel Navigator stack) |
| Waiver         | W-AA-1; all Navigator flags stay default **false**                                                                                              |
| Verdict        | **NARROW_SCOPE**                                                                                                                                |

## Implementation status on this branch

| Phase                    | Status                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Enforcement foundation | Complete — gates, consent, envelopes, A2H, prohibitions                                                                                                 |
| 2 Participant control    | Complete — Decision Passport, memory, opt-out, escalation UI/API                                                                                        |
| 3 Bounded Navigator      | Complete — interpret review, hard constraints, ranking, orchestrator                                                                                    |
| 4 Assurance              | Complete — see [`NAVIGATOR_ASSURANCE.md`](./NAVIGATOR_ASSURANCE.md); production flags remain off                                                        |
| 5 Vertical slice closure | Complete (code) — journey UI, Finder transfer materialisation, non-negotiables, draft edit API; lived-experience / ops / flag enablement still deferred |

---

## Related documents

- [`NAVIGATOR_ASSURANCE.md`](./NAVIGATOR_ASSURANCE.md)
- [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)
- [`AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md`](./AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md)
- [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`CAPABILITY_REGISTRY.md`](./CAPABILITY_REGISTRY.md)
- [`THREAT_MODEL.md`](./THREAT_MODEL.md)
- [`PILOT_RUNBOOK.md`](./PILOT_RUNBOOK.md)
- [`ROLLBACK.md`](./ROLLBACK.md)
- [`../remediation/FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md)
- [`../careos/CONSENT_AND_AUTHORITY.md`](../careos/CONSENT_AND_AUTHORITY.md)
- [`../search/guided-search-dialogue.md`](../search/guided-search-dialogue.md)
