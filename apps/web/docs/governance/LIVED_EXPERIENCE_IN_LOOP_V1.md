# MapAble Lived Experience in the Loop (LEIL) — v1

**State:** deterministic governance-code prototype, no verified co-design participation and no production authority.

## Purpose

Make meaningful, paid, disability-led co-design part of product governance instead of an optional consultation. This extends the existing Co-Design Protocol (S0–S6), Portfolio Stage Gates (G0–G6), Human Safeguards, Shared Core permissions, ConsentRecord and AuditEvent. It must not create a second consent or authorisation system.

**AI cannot be a disabled person's lived experience.** Simulated personas, sentiment analysis, AI-generated stories, tests and token consultation never count as an endorsement. The agent drafts questions and identifies gaps. Actual disabled people and organisations review, challenge and make decisions.

## Scope and powers

1. Generate accessible co-design questions and scoped review briefs (draft only).
2. Classify changes requiring disability-led review, including affected modules and cohorts.
3. Validate a structured manifest with a separately computed digest binding evidence to the code and proposal.
4. Verify independently signed, stage-specific human attestations against an externally administered reviewer registry.
5. Check required stages, distinct disability-led organisations, relevant cohort involvement, age, revocation and objections.
6. Return HOLD when evidence is absent, questionable or a review objection remains unresolved.
7. Return EVIDENCE_READY_FOR_HUMAN_RELEASE_REVIEW when stage-specific evidence is verified. **This is never permission to merge or deploy.**

V1 is deliberately read-only: it has no AI model invocation, participant data storage, live contributor records, credential authority, database schema change, public approval portal or external update action.

## Constitutional human governance rules

- Human disability-led co-design reviewers have genuine authority to raise objections; the accountable corporate officer remains responsible for lawful release. An objection cannot be silently reclassified as approval.
- Paid participation and accessibility support must be planned before sessions, including AAC, Easy Read, interpretation, pacing, remote participation, and flexible arrangements. Compensation and attendance must be corroborated in protected records; a signed Boolean alone is not proof.
- Recruit people whose experiences match the proposed product's affected communities. A single reviewer never represents all people with disability. Support perspectives including physical, intellectual, sensory, psychosocial, cognitive, neurological, multiple and episodic disability as relevant.
- First Nations disability-led governance is necessary for work materially affecting First Nations people or data, with appropriate community authority and data-sovereignty requirements.
- Respect contributor withdrawal, paid expertise, dissent, anonymity, conflicts of interest, correction, and the opportunity to challenge decisions.
- Co-design group sign-off never overrides a participant's specific consent, refusal or chosen communication mode.
- No AI agent can enroll trusted keys, update reviewer authority, revoke another person's objection, alter mandatory gates, merge protected changes, deploy or grant itself wider access.
- Representatives mentioned in older MapAble planning documents must not be described as current partners or endorsers without real confirmation and permission.

## Co-design stage requirements

| Milestone | Human stage evidence required |
| --- | --- |
| Discovery | S0 + S1 |
| Prototype | S0–S2 |
| Coordinator pilot | S0–S3 |
| Participant pilot | S0–S4 |
| General release | S0–S5 |
| Continuous review | S0–S6 |

The initial policy expects stage-specific evidence from two independently verified disability-led organisations (with a relevant-cohort reviewer for First Nations and intellectual disability changes at S2–S5). A trusted organisational identity must be verified by a real administrator, not self-declared. Organisational signatures are one proof, not a substitute for real attendance, approved outputs, properly paid work, accessible processes and feedback disposition.

Every sign-off binds to an exact proposal digest, including the independently calculated code-content digest. Any materially changed proposal requires new human review.

## Technical files

- apps/web/lib/governance/lived-experience-loop/agent.ts
- apps/web/scripts/ci/lived-experience-gate.mjs
- apps/web/tests/lived-experience-loop.test.ts
- .github/workflows/lived-experience-co-design.yml

The agent has only three outcomes: NOT_APPLICABLE, HOLD_FOR_CO_DESIGN and EVIDENCE_READY_FOR_HUMAN_RELEASE_REVIEW. All outcomes set productionAuthorised to false.

A signed record contains pseudonymous reviewer key and organisation identifiers, S0–S6 stage, decision, proposal digest, date, evidence reference, remuneration and access-arrangements acknowledgements, plus Ed25519 signature. The trusted public key registry and revocation list must be administered separately, not contained in any PR. Do not commit contributor identities, payment records, health details or raw interview recordings. Signed receipt metadata is not the full research record.

## Important first-release limitations

The GitHub pull_request workflow intentionally has no trust-registry secret and therefore *holds* all qualifying changes: it is not yet a complete approval path. Do not inject signing or trust credentials into untrusted PR execution, including pull_request_target jobs that execute candidate code.

A future independently controlled verification service must validate signed evidence against an immutable SHA using trusted code and keys outside the candidate PR; independently controlled branch protection must enforce this release check. A passing pull request is not evidence of genuine co-design unless the trusted review authority and release workflow are actually functioning. Current repository ruleset and human governance verification remain outstanding.

MapAble's active Feature Freeze prohibits adding agents and major domains without a documented waiver. This branch demonstrates a narrow draft implementation and does not authorise production use. Review the freeze waiver and programme status before merging.

## Next implementation stages

1. Appoint and remunerate an independent disability-led governance panel and accountable Co-Design Lead. Verify mandate and representation, including accessible participation arrangements.
2. Establish a protected, human-owned enrolment and verification service for reviewer identities, signed reviews, conflicts, revocation, and secure evidence attachments.
3. Build a WCAG 2.2 AA governance reviewer workspace supporting keyboard, switch, AAC, screen readers, Easy Read, save-and-return, and no-AI workflow.
4. Integrate signed records with existing MapAble governance and audit services without duplicate identity or consent.
5. Add an independent trusted GitHub release attestation workflow, protected branch rules and human approval.
6. Trial with one synthetic Provider Finder accessibility change and real paid disability co-design before extending to Care, matching, funding or robotics.

## Acceptance and measures

Test that unsigned, stale, duplicated, revoked, out-of-scope and insufficiently representative review records hold; that a genuine signed objection is never overwritten; that post-review code edits invalidate attestations; and that no agent can self-authorise release.

Report whether research changed a product decision, which recommendations were accepted or declined with reasons, unresolved harms, accessibility and user-testing outcomes, contributor remuneration/access support and procedural fairness. Never generate a universal lived-experience or disability-compatibility score.

**Success means that disabled people exercise genuine governance power over product development, with transparent evidence of what changed because of their participation.**
