# MapAble Relational Fit v1 — Participant-directed, worker-opt-in comparison

**Status:** Implemented on a stacked draft feature branch; not independently verified live or deployed.
**Depends on:** Support Builder draft PR #45, branch `feature/provider-finder-support-builder-ai-sdk-neon-20261117`.
**Controls:** `MAPABLE_SUPPORT_BUILDER_ENABLED=false` and `MAPABLE_RELATIONAL_FIT_ENABLED=false` by default. Routes and pages also hard-deny Vercel production even if enabled.
**Scope:** Australian disability support discovery. No NDIS funding determination, employment decision, medical decision, worker assignment or automatic contact.

## 1. Participant outcome and decision

Build an optional participant-first worker comparison that uses **participant-chosen work requirements** and **worker-affirmed, opt-in practices**, preserving human review. Do not infer personality traits, intelligence, emotional health, social desirability, moral worth, relationship success or capacity.

Decision: **GO for protected, isolated preview and evaluation only**. **NO-GO for live worker placement, public matching, psychometrics or production schema migration.**

## 2. Evidence ledger and current limits

| Finding | Classification | Evidence | Consequence |
| --- | --- | --- | --- |
| Support Builder chat and editable package | Implemented, not verified live | PR #45 `apps/web/app/provider-finder/builder` | Extend existing surface |
| Existing care matcher and explanations | Implemented in code | `lib/matching/matching-service.ts`, `lib/ai/matching/ai-match-service.ts` | No second assignment authority |
| Participant rights snapshot and blocked IDs | Implemented in code | `lib/intelligence/careos/context/participant-rights.ts` | Refuse matches if rights snapshot unavailable |
| Linked worker profiles and credential models | Implemented in code | `prisma/schema.prisma` | Use existing identity/role/worker source |
| Neon `MabAble` in `aws-ap-southeast-2` | Directly inspected 17 Nov 2026 | Not proof of app/runtime sovereignty |
| `MabAble` legacy `workers` table has 7 records, `worker_availability` has 0 | Directly inspected 17 Nov 2026 | **Not evidence of verified WorkerProfile candidates** |
| New `relational_fit_worker_profiles` table | Proposed migration in PR, unapplied | `prisma/migrations/20261117000000_relational_fit_worker_opt_in` | Must reconcile canonical schema before preview |
| Psychometric prediction of interpersonal compatibility | Not established | No validated MapAble dataset or psychometric instrument | Forbidden in v1 |

## 3. Bounded experience

Participant journey:
1. Open Support Builder, describe a support goal or choose the non-AI component form.
2. Opt in to the **Relational Fit** panel; choose required communication methods and optional routine, interaction, initiative and continuity preferences.
3. Mark preferences as essential or preferred; essential mismatches and unknowns are not silently traded off against other criteria.
4. Submit only those structured selections and an optional approximate locality to a same-origin authenticated API; chat transcript is **not sent**.
5. Review an **explainable potential-lead list** drawn only from actively linked workers who voluntarily declared their practices. There are no percentage “compatibility scores”.
6. Choose whether to seek human assistance or return to the Provider Finder; no worker is contacted, booked, assigned, or privately messaged.

Worker journey:
1. Sign in using an existing MapAble account linked to the worker profile.
2. Review the benefits, risks, employer protections and applicable privacy notice.
3. Choose communication methods they can actually support, with four optional workstyle descriptions.
4. Select a separate, affirmative opt-in checkbox to save a purpose-limited declared-workstyle profile.
5. Reopen settings to edit or withdraw; withdrawal deletes their voluntary profile with an audit receipt, but does not delete legally required professional records.

## 4. Matching algorithm (versioned; non-psychometric)

### Hard preconditions

- Signed-in **participant**, acting for self only (v1 delegates deferred).
- Participant rights snapshot available and evaluated.
- Never show blocked worker or provider IDs.
- Participant's required language, communication capabilities and worker-credential requirements must be met by recorded evidence; otherwise omit/hold for human help.
- Internal worker and organisation state must be active and verified as **recorded in the app** and the worker's internal screening status must be recorded as verified. **This is NOT independent verification of a currently valid clearance**; authorised checks remain mandatory before assignments.
- Worker has an individually controlled opt-in linked to their own WorkerProfile.
- Additional hard constraints the v1 engine cannot interpret (e.g. complex hard exclusions) trigger a human-assisted pathway, not a hidden workaround.
- No times, availability or task detail supplied: **never infer availability** or specific role competence.
- No verified suburb-to-worker service-area geometry: worker-declared service regions are only annotations, not guaranteed coverage.

### Advisory comparison

- Communication methods: strict, participant-selected prerequisites (text, AAC, spoken, Auslan, Easy Read).
- Routine: structured, flexible, or no preference.
- Interaction: quiet, conversational, or no preference.
- Initiative: ask first, offer options, or no preference.
- Continuity: regular, variable, or no preference.
- Workers can self-declare adaptable/not stated per dimension.
- Only compare corresponding, explicitly declared practices. Essential unknown/mismatch => no candidate; preferred mismatch => a discussion item.
- Order visible leads by **count of documented aligned declarations**, not a universal personality, hiring, quality, safety or relationship score.
- Each lead includes aligned items, questions, unknowns and recorded evidence limits; human review is mandatory.

### Invariants

- The engine **must not** call a generative AI model to decide matching. Vercel AI SDK remains part of the surrounding Support Builder conversation, not of this comparison.
- No worker may be penalised for not opting in. Human/manual discovery remains available, but v1's preview lead list only contains opted-in profiles.
- No subjective assessments from incidents or complaints are converted into a worker personality score.
- No inference from diagnosis, AAC usage, dysarthria, ethnicity, sex, age, religion or protected identity.
- Never auto-assign, auto-book, contact, deny employment, alter funding, enforce restrictive practices or override participant refusal.

## 5. Neon database and access control

Add `RelationalFitWorkerProfile` to the existing Prisma schema. It is a child of `WorkerProfile`, keyed by `workerProfileId`; on worker-profile deletion it cascades. It stores a small set of enumerated work-practice selections and opt-in timestamp/version—not diagnosis, psychometric results, participant biography, free-text notes, model output or match scores.

**Do not run the migration on the observed Neon project's production branch.** The inspected `MabAble` database exposes a legacy table layout and must be reconciled against the canonical Prisma schema. Require a protected, dedicated preview branch with a matching schema and verified rollback/restore evidence. Use a pooled runtime `DATABASE_URL` and direct connection only for reviewed migrations. Verify actual Vercel deployment/database linkage; both legacy live Vercel projects previously pointed to `ausdisau/mapableau-new`.

Worker write API:
- `GET /api/provider-finder/builder/relational-fit/worker-profile` — only signed-in worker's linked records.
- `PUT .../worker-profile` — subject-to-workerId ownership and explicit opt-in; audited.
- `DELETE .../worker-profile?workerProfileId=...` — only owner can withdraw; delete voluntary profile and audit the withdrawal.
- Same-origin checks, bounded Zod schemas, no cross-tenant guess, no unauthorised delegation.

Participant read/comparison API:
- `POST /api/provider-finder/builder/relational-fit/matches` — authenticated, self only, server obtains participant ID, rights snapshot and worker records; does not store query preferences; audit access event (not raw preferences); no worker contact or side-effect.
- Suppress sensitive provider/worker fields outside explicitly allowed preview profile display.
- `Cache-Control: private, no-store` on all responses.
- Both APIs fail closed if DB/auth/rights/audit is unavailable.

### Worker withdrawal and legal retention

The voluntary practice declaration is deleted on withdrawal. The audit event records the fact, actor and time only. Professional credential records, complaints and legally required employment records are separate and not automatically erased. Deletion timing, backups, and lawful-retention limitations must be disclosed in a final privacy policy.

## 6. User-facing legal/AI notice

The always-visible Relational Fit panel, worker settings, and `RelationalFitDisclosure.tsx` state:

- **Potential benefits:** less repeated explanation; participant-editable preferences; transparent worker conversations. Benefits have not been established in a live MapAble evaluation.
- **AI limitations:** the *surrounding* chat may generate inaccurate text or vary by model; this worker matcher does not send preference data to LLMs, classify personality or predict success.
- **Data limitations:** workers self-declare practices; databases and screening signals may be stale; no validated live coverage, availability or independent clearance check.
- **Privacy and fairness risks:** sensitive context, bias, missed matches, unfair employee treatment, lack of Australian inference residency; explain non-AI and human pathways.
- **Rights:** voluntary participation, correction and withdrawal; worker right to fair work and accommodation; participant choice, supported decision-making, accessible communication, complaints and review.
- **Scope:** not legal, medical, psychological or NDIS eligibility advice; **no disclaimer removes statutory rights or provider obligations**.
- **Additional 2026 obligation:** APP entities meeting the statutory conditions must update privacy policies for certain automated decision processes from **10 December 2026**; determine applicability through counsel before launch.
- Employment psychometric tests, if ever added later, require professional assessment of validity, job-relatedness, adjustments, consent, disparate impact and a qualified professional's interpretation. They are explicitly absent in v1.

Official guidance:
- OAIC privacy/AI: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products
- OAIC automated-decision transparency, September 2026: https://www.oaic.gov.au/news/media-centre/new-resources-on-transparency-for-use-of-ai-and-automated-decision-making
- NDIS Worker Screening (12 October 2026 portal change): https://www.ndiscommission.gov.au/workforce/worker-screening
- NDIS Code of Conduct: https://www.ndiscommission.gov.au/ndis-code-conduct
- Australian Human Rights Commission recruitment assessment guidance: https://humanrights.gov.au/resource-hub/theres-nothing-casual-about-racism/guidetool/step-by-step-guide-to-preventing-discrimination-in-recruitment
- Fair Work Ombudsman: https://www.fairwork.gov.au/employment-conditions/protections-at-work/protection-from-discrimination-at-work
- APS psychological testing standards: https://psychology.org.au/psychology/about-psychology/what-is-psychology/psychological-tests-and-testing

## 7. Tests and release gates

Run in the canonical `apps/web` workspace using existing pinned pnpm and Prisma:

```sh
pnpm exec vitest run tests/support-builder-core.test.ts tests/relational-fit.test.ts
pnpm type-check
ESLINT_CI_LIGHT=1 pnpm exec eslint lib/support-builder/relational-fit.ts components/support-builder app/api/provider-finder/builder/relational-fit app/provider-finder/builder/worker-profile tests/relational-fit.test.ts --max-warnings 0
```

Before any public pilot:
1. Review the preview migration and prove schema compatibility with the correct Neon project/branch.
2. Test worker ownership, read/write/revoke, multi-tenant isolation, explicit opt-in, no model calls and race conditions.
3. Confirm current screening/credential evidence via authorised official pathways and identify accountable human reviewer.
4. Implement a **distributed** rate limit and appropriate identity, CSRF, session, consent, audit and retention protections. Existing process-local IP limit is insufficient for public use.
5. Conduct human-centered accessibility testing across screen readers, keyboard/switch, AAC, zoom/reflow, loading, focus and error states (WCAG 2.2 AA target; not a conformance claim).
6. Complete privacy impact assessment (cross-border AI and data subprocessors), legal/worker-rights review, fairness testing, adversarial prompts, no-match and complaint pathways.
7. Verify Vercel preview domain/project ownership, AU function region, data storage location and secret scoping.
8. Validate that opt-out is immediate in future shortlist reads, including caches and backups as legally appropriate.
9. Clear all repository TypeScript/tests/lint gates and obtain a human GO decision.
10. Rehearse rollback: disable `MAPABLE_RELATIONAL_FIT_ENABLED`; no model actions, no auto book; preserve backups and audit integrity.

## 8. Future validated psychometrics (not part of v1)

Only consider job-relevant situational judgement exercises if qualified occupational psychologists and disability-led participants co-design an evidence protocol. Pre-register hypotheses; demonstrate construct validity, reliability, accommodation fairness, cultural fit, incremental value beyond work-practice preferences and actual outcome benefit. Provide worker choice, meaningful consent, transparent explanation and an alternative assessment. Avoid universal personality compatibility scores and protected-attribute proxies.

## 9. Ownership and next decision

- **Product owner:** MapAble Care / Australian Disability Ltd (owner confirmation required).
- **Safety/rights reviewers:** participant representatives, worker representatives, credential reviewer and independent legal/privacy reviewer (not yet appointed).
- **Engineering owner:** canonical MapAble repo reviewers.
- **Next gate:** Protected preview on a canonical-schema Neon branch and CI-pass, **not** public matching.
