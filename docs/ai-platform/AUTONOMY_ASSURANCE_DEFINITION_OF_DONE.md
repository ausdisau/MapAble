# MapAble AI Autonomy Assurance — Definition of Done

**Programme:** MapAble AI Autonomy Assurance (extends Trust Fabric + AURA harness; not a second platform)  
**Freeze waiver:** W-AA-1 — [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md)  
**Prompt 0 reconciliation:** [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)  
**Baseline `main` at Prompt 0:** `dd5ff9fc`

The programme is **complete only when** every criterion below is met. Feature flags remaining default-false and public claims remaining internal/experimental are part of Done, not temporary excuses.

## Criteria

| # | Criterion | Owning prompts | Status on `main` @ `dd5ff9fc` |
|---|-----------|----------------|-------------------------------|
| 1 | Every agentic or tool-using capability has an ARC assessment | 1 | **Partial on Navigator branch** — ARC sidecar + `agent.aura_*` / `navigator.*` seeded; not yet on `main` |
| 2 | ARC tiering uses critical-dimension logic and does not grant runtime authority | 1 | **Partial on Navigator branch** — classification only; no runtime authority grant |
| 3 | AURA v2 is formula-tested, versioned and calibrated in shadow mode | 2 | **Not met** — legacy harness only |
| 4 | Legacy AURA behaviour remains regression-tested until a separately approved cutover | 2 | **Partial** — legacy tests exist; no versioned cutover policy |
| 5 | Memory is participant and tenant scoped, versioned, revocable and unable to bypass current authority | 2, 6 | **Partial on Navigator branch** — governed memory categories; AURA fingerprint memory still separate |
| 6 | Mitigations are checked for rights restriction and least-restrictive alternatives | 3 | **Partial** — Navigator least-restrictive notes; full Dignity-of-Risk kernel still absent |
| 7 | Decision Passport is participant-controlled and not a consent or capacity system | 4 | **Partial on Navigator branch** — projection + UI shell; not on `main` |
| 8 | Action envelopes are signed, expiring, one-time, hash-bound and revalidated at execution | 5 | **Partial on Navigator branch** — Governed Envelope v2 draft-only; CareOS v1 remains |
| 9 | Only canonical deterministic services write consequential outcomes | 5 | **Partial** — Navigator draft/transfer only; no book/pay |
| 10 | A2H reviews are role and tenant safe and never auto-execute | 6 | **Partial on Navigator branch** — tenant/participant fields + resolve checks |
| 11 | Existing receipts, notices, attestations and audits are reused coherently | 7 | **Partial on Navigator branch** — navigator.* audit chain; full choreography still open |
| 12 | Participants can understand, challenge, correct and request human help | 7, 8 | **Partial on Navigator branch** — Passport panel + opt-out + escalate; lived-experience gate open |
| 13 | No clinical, legal, safeguarding, payment, claim, service-reduction or worker-discipline decision is delegated to AI | All | **Policy held** in docs/freezes; must remain true through every prompt |
| 14 | Accessibility and security suites are green | 8 + CI | **Track per PR** — not programme-closed |
| 15 | Migrate-from-zero is green for any additive schema | 2, 6, 7 as needed | **Track per schema PR** |
| 16 | All feature flags remain default false | All | **Required throughout** |
| 17 | Public claims remain internal or experimental | All | **Required throughout** |
| 18 | Human, specialist and account-owner gates are clearly identified | 0–8 docs | **Partial** — Prompt 0 ownership table; product gates incomplete until Trains A–C land |

## Train completion map

| Train | Prompts | Theme | DoD criteria advanced |
|-------|---------|-------|------------------------|
| 0 | Reconciliation + W-AA-1 | Baseline lock, SoT, freeze waiver | Programme entry gate |
| A | 1–3 | ARC; AURA v2 shadow + memory; Dignity of Risk | 1–6, 13, 16–18 |
| B | 4–6 | Decision Passport; Governed Envelope v2; A2H hardening | 7–10, 13, 16–18 |
| C | 7–8 | Evidence/redress; accessible controls + shadow pilot | 11–12, 14–18 |

Prompt plans (agent artefacts, not yet merged product PRs): Prompt 1–7 plans under `/opt/cursor/artifacts/plans/prompt_*`. Prompt 8 owns full accessible participant/governance UI and pilot controls.

## Permanent prohibitions (never “done” by enabling)

AI must not autonomously:

- approve funding, claims, invoices or payments
- reduce support or services
- assign, suspend or punish workers/drivers
- make clinical, behaviour-support, restrictive-practice or safeguarding findings
- alter consent or infer capacity / mental state from voice, face, gait or behavioural telemetry

## Exit checklist (human gates)

Before declaring the programme complete, account owner / specialist reviewers confirm:

1. W-AA-1 still accurate; no silent production enablement
2. ARC coverage table complete for all agentic/tool-using/hybrid capabilities
3. AURA v2 shadow calibration reviewed; **no threshold cutover** without a separate approval
4. Memory and A2H IDOR suites green
5. Decision Passport and redress paths usable by participants (Prompt 8)
6. Evidence choreography maps every governed action class without a second ledger
7. Accessibility, security, and migrate-from-zero CI green on the final Train C tip
8. Public claim registry unchanged (`internal_alpha` / not claimable)

## Related docs

- [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)
- [`MERGE_TRAIN.md`](./MERGE_TRAIN.md)
- [`TRUST_FABRIC.md`](../productisation/TRUST_FABRIC.md)
- [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md)
