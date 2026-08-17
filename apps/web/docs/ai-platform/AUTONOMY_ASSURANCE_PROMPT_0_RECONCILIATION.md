# Prompt 0 — MapAble AI Autonomy Assurance Reconciliation

**Mode:** documentation only (no runtime / schema changes in this PR)  
**Inspection timestamp (UTC):** 2026-07-27T22:53:41Z  
**Repository:** `ausdisau/mapableau-new`  
**Pack baseline commit:** `dd5ff9fc2dd56794b33f428bb5bb4c8197694ec5`  
**`origin/main` at inspection:** `dd5ff9fc2dd56794b33f428bb5bb4c8197694ec5`  
**Reconciliation branch:** `cursor/autonomy-assurance-prompt-0-59aa`  
**Verdict:** **NARROW FREEZE WAIVER REQUIRED** (not clean GO, not pause)

## Purpose

Reconcile the MapAble AI Autonomy Assurance Cursor Prompt Pack against current `main` before Train A (ARC / AURA v2 / Dignity of Risk). The pack **extends existing Trust Fabric** and the in-process AURA harness; it does not introduce a second platform with the same name.

## Baseline lock

| Item | Value |
|------|--------|
| Pack-observed commit | `dd5ff9fc2dd56794b33f428bb5bb4c8197694ec5` |
| `origin/main` (fetched) | `dd5ff9fc2dd56794b33f428bb5bb4c8197694ec5` |
| Drift | **None** — snapshot is tip of `origin/main` |
| Pause for main movement? | **No** |

Recent tip commits are marketing/CI only. No Trust Fabric, consent, authority, or AURA ownership changes since the pack was prepared.

## Verdict rationale

1. **Not pause** — `main` has not moved under the pack.
2. **Not clean GO** — [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md) is **active**; Prompt 1+ adds governed capability surface (ARC sidecar, AURA formula versioning, memory hardening, Decision Passport projection, A2H security).
3. **Narrow waiver** — proceed only under waiver **W-AA-1** (recorded in the freeze doc). Flags remain default-false; no production enable; no AI decision authority; no second consent SoT; no `lib/aura/` Agent OS.

## Source-of-truth ownership

| Concern | Canonical owner today | Pack posture |
|---------|----------------------|--------------|
| Consent | `lib/consent/consent-service.ts` + `ConsentRecord` | Sole SoT — never replace |
| Authority grants | `ParticipantAuthorityGrant` via `lib/authority/participant-authority-service.ts` **and** `lib/programmes/authority/participant-authority-service.ts` | **Collision:** two writers — Decision Passport must **project**, not invent a third grant path |
| Agent registry | `lib/ai/platform/capabilities/**` | ARC is a **versioned sidecar**, not a marketplace |
| Runtime risk | `lib/aura-harness/**` (+ `recognise/**`) | Deepen harness; do not resurrect `lib/aura/` |
| Trust Fabric | `lib/trust/fabric/**` + `lib/config/trust-fabric.ts` | Extend; keep permanent AI/auto-authority denials |
| Action proposal | `intelligence/actions/action-envelope.ts` (`CareOSActionEnvelope`) | Parallel to A2H — Governed Envelope v2 must choose attachment carefully |
| Human review | `lib/act/handoff/**` + `ActHandoff` | Approval = **approved for retry**, never execute-now |
| Access evidence | `ParticipantAccessReceipt` | Keep distinct from attestations |
| Consequential explanations | `DecisionNoticeRecord` | Keep distinct from attestations |
| Factual attestations | `lib/attestations/attestation-service.ts` | Claim + evidenceHash only |
| Policy gates | `SmartContractRun` / contract runner | Distinct job from attestations |
| Execution proof | `CareOSActionReceipt` | Distinct job from access receipts |
| Audit | `AuditEvent` | Cross-cutting append-only |

Trust Fabric non-goals ([`TRUST_FABRIC.md`](../productisation/TRUST_FABRIC.md), `lib/config/trust-fabric.ts`):

- `aiDecisionAuthorityEnabled: false` (permanent)
- `automaticAuthorityEnabled: false` (permanent)
- No new consent source of truth
- No RightsOS Decision Room / vault / capsules wholesale merge

## Freeze and stack policy

[`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md) bans new top-level OS layers, new AI agents/marketplaces, second consent SoT, autonomous safeguarding/payments/claims/assignment, and product stacks deeper than **three** unmerged PRs. Capability flags must default **false**.

[`MOAT_PR_RECONCILIATION.md`](../productisation/MOAT_PR_RECONCILIATION.md) already marks AURA mega-stacks and public-interest governance tips as **extract-only**.

| Open PR | Topic | Files | Mergeable | Stance |
|---------|-------|------:|-----------|--------|
| #299 | Wave 10 AURA participant Agent OS | 1033 | CONFLICTING (draft) | **Extract-only** — do not rebase/cherry-pick wholesale |
| #311 | Public algorithm register / appeals / oversight | 1625 | CONFLICTING (draft) | **Extract-only** — do not rebase/cherry-pick wholesale |

No open PRs named ARC, TrustX, Decision Passport, Dignity of Risk, AURA v2, or `paper_aligned`.

**Train rule for this programme:** Train A / B / C each stay within ≤3 unmerged product PRs and must **not** attach to active waived stacks that already breach stack policy (e.g. Geoscape W-GEO-1).

## Schema and seam collisions (for later prompts)

| Seam | Finding | Later prompt impact |
|------|---------|---------------------|
| AURA formula | `lib/aura-harness/gamma-calculator.ts` uses scores on 0–100; `C_conc = 200 × √(σ²)` | Prompt 2: `repo_legacy_v1` + `paper_aligned_v2_shadow`, divergence reporting, **no threshold cutover** |
| AURA memory | `AuraHarnessMemory.fingerprint` unique on tool+payload only; evaluator may short-circuit on memory | Prompt 2: participant/tenant/policy scoping + revocability; memory must never replace consent/authority/stop/tenancy/payload checks |
| Registry honesty | Docs list `agent.aura_harness` / `agent.aura_recognise`; **absent from** `lib/ai/platform/capabilities/seed.ts` | Prompt 1: register ARC-linked capability keys before claiming design-time governance |
| Trust Fabric HTTP | `app/api/trust-fabric/**` returns Post-V1 **501** while library/UI exist | Extend library + flag-gated UI; do not silently re-enable demoted APIs |
| Dual envelopes | CareOS prepare/execute vs `ActHandoff` | Prompts 5–6: keep jobs distinct |
| A2H model | `ActHandoff` has requester/assignee, **no tenantId**, redacted `payloadJson` | Prompt 6: tenant/assignee/reviewer scoping, concurrency, stale approval, payload minimisation, memory poisoning |
| Naming | Communication Passport exists; Decision Passport does not | Prompt 4: Decision Passport = **projection** only |
| Dignity of Risk | Policy prose only (`research/hitl-ai-disability-services-au.md`) | Prompt 3: MapAble design extension — mitigation restrictiveness only; never participant dangerousness/capacity scores |
| Deferred Agent OS | `lib/aura/` **absent** on main | Correct — deepen `lib/aura-harness/` only |

## Reusable vs missing

**Reuse / deepen:** capability registry metadata, kill switches, authority ceilings, AURA harness + Recognise, consent/authority services, CareOS envelope, ActHandoff, access receipts, decision notices, attestations, smart-contract runs, action receipts, audit events, Trust Fabric permanent denials.

**Missing (pack scope):** TrustX ARC design-time classification sidecar; versioned paper-aligned AURA shadow engine; participant/tenant/policy memory isolation; Dignity of Risk Kernel; Decision Passport projection; A2H security hardening; evidence choreography/redress clarity; accessible controls + shadow pilot.

## Permanent prohibitions

No autonomous:

- funding, claim, invoice, or payment approval
- support reduction
- worker or driver assignment
- worker suspension or punishment
- clinical or behaviour-support decisions
- restrictive-practice approval
- safeguarding findings
- consent alteration
- capacity inference
- mental-state inference from voice, face, gait, or behavioural telemetry

AI may interpret / retrieve / explain / summarise / propose under human and participant authority only.

## Prompt sequence (post-waiver)

| Train | Prompts | Theme |
|-------|---------|--------|
| A | 1–3 | ARC governance foundation; AURA v2 shadow + memory hardening; Dignity of Risk |
| B | 4–6 | Decision Passport projection; Governed Action Envelope v2; A2H review queue hardening |
| C | 7–8 | Attestations / decision notices / redress; accessible controls + shadow pilot |

## Gate for Prompt 1

| Gate | Status |
|------|--------|
| Main tip matches pack baseline (or re-reconciled) | **Pass** (`dd5ff9fc`) |
| Narrow freeze waiver W-AA-1 recorded | **This PR** |
| Fresh ≤3 Train A stack (not attached to Geoscape / other breached stacks) | **Ready after this PR merges or is accepted as docs precursor** |
| Prompt Pack text available in workspace | **Partial** — pack file was not on disk at inspection; use in-chat pack summary + this reconciliation until the full pack is attached |
| No wholesale merge of #299 / #311 | **Confirmed** |

**Prompt 1 may begin only under W-AA-1.** Deliverable shape: versioned ARC classification sidecar to the existing capability registry (seven agent categories, GPA + IAT, L1–L5, twelve 1-to-3 risk dimensions with critical-dimension tiering, coding-assistant extension) — **not** a new agent marketplace.

If W-AA-1 is refused: pause product implementation; this docs-only reconciliation remains the freeze-compliant artefact.

## Related docs

- [`AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md`](./AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md) — programme exit criteria
- [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md) — W-AA-1
- [`TRUST_FABRIC.md`](../productisation/TRUST_FABRIC.md)
- [`MOAT_PR_RECONCILIATION.md`](../productisation/MOAT_PR_RECONCILIATION.md)
- [`AURA_HARNESS.md`](./AURA_HARNESS.md)
- [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`CAPABILITY_REGISTRY.md`](./CAPABILITY_REGISTRY.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
