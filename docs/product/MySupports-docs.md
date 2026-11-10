# My Support — Participant Sovereignty and Development Doctrine

**Document file:** \`docs/product/MySupports-docs.md\`  
**Product name:** My Support (two words); "MySupports-docs.md" is the requested durable filename.  
**Steward:** Australian Disability Ltd / MapAble  
**Version:** 1.0 — 10 November 2026 (Australia/Sydney)  
**Status:** Adopted as a *proposed project-wide development standard* in this documentation PR; not a claim of production deployment, compliance certification, or legal authority.  
**Scope:** MapAble web, mobile, Care, Transport, Jobs, Access, Marketplace, ProviderCloud, CripSquare integrations and AI-assisted workflows.  
**Operational reference:** [Feature Development Memory](../development/FEATURE-DEVELOPMENT-MEMORY.md)

## 1. Purpose and north star

**My Support is the participant-controlled governance layer for the care and support relationships that make ordinary life possible.** A participant must be able to see, choose, direct, decline, correct, review and challenge arrangements without becoming subordinate to provider workflows or AI optimisation.

> **My Support. My Life. My Decisions.**  
> The person is not the workflow. The workflow serves the person.

The product outcome is **effective participant agency**, not a greater count of taps, automated shifts, completed checklists, or an "autonomy score". Accessible human service and a working no-AI path are core requirements.

**My Day** expresses what a participant wants to do and the dependencies involved. **My Support** expresses the participant's choices, boundaries, permissions, evidence, accountability and remedies regarding the services that make the day possible. Do not create two competing sources of truth.

## 2. Seven practical powers to design for

| Power | Participant-facing capability | Do not misrepresent |
| --- | --- | --- |
| **Choose** | Review, select, prefer or decline proposed workers/providers | A proposed worker is neither booked nor screened by implication |
| **Direct** | State routines, timing, pace, support preferences and communication methods | A preference is not an automatically accepted provider agreement |
| **Consent** | Review purpose-bound, limited and revocable disclosures/delegation | A family relationship does not confer blanket access or decision authority |
| **Verify** | Inspect booking state, evidence provenance, service logs and invoices | "Recorded as delivered" is not independent confirmation |
| **Challenge** | Correct or dispute notes, request reasons, challenge invoices, seek complaints pathways | Provider records and participant accounts may conflict; preserve both |
| **Recover** | See cascading disruptions, consider alternatives, reach a human coordinator | A recovery suggestion must not silently dispatch or change a booking |
| **Leave** | Export information and plan transitions between organisations | Portability does not cancel contract terms, guarantee new supports or prevent gaps by itself |

These capabilities are design goals. A production claim requires tested, authorised implementations and, where relevant, participating service providers.

## 3. Non-negotiable decision rules

1. **Address the participant directly.** Do not infer incapacity from disability, dysarthria, AAC, a supporter attending, or slow communication. Provide extra response time and supported decision-making where chosen.
2. **Respect refusals as first-class inputs.** "No", "not now", "I prefer someone else" and "do not share" must survive refresh, delegation and proposed automation **only when an authorised production workflow is implemented**; local prototypes must be labelled as such.
3. **Keep preferences separate from authority.** Store who stated a preference, when, how it was verified, and whether a delegate actually has a scoped legal/contractual authority.
4. **Use explicit confirmation for consequential changes.** No worker substitution, care cancellation, transport dispatch, financial approval, disclosure or external message based only on a model suggestion.
5. **Make uncertainty visible.** Prefer "request received", "provider accepted", "worker assigned in system", "arrival recorded" and "awaiting participant review" over a generic green "confirmed".
6. **Do not hide unresolved harm.** A cancelled shift, missed transport or unprovided support remains visible even if a downstream ticket is closed.
7. **Allow contestability.** Participants can seek a correction or append their own account; the platform must not silently overwrite disputed histories.
8. **Preserve rights at the boundary.** A participant choice cannot be used to claim authority over third-party employment, regulated clinical decisions, safety checks, NDIS law or contractual obligations that the platform does not control. Explain these limits and offer a human pathway.
9. **Minimise data by default.** Health, disability, location, relationships, finance and worker details are not bulk-sent to AI, analytics or third-party providers.
10. **Release only proven capabilities.** Mark each surface as *verified live*, *implemented but unverified*, *in development*, *proposed*, *exploratory* or *historical*.

## 4. Where My Support fits in the MapAble ecosystem

| Experience | Design responsibility | Existing authority to reuse |
| --- | --- | --- |
| **My Day** | Goal-centred time, activities and dependency explanation | Existing calendar, CareOS, Care and Transport systems |
| **My Support** | Choice, boundaries, status evidence, disputes, recovery and accountability | Existing identity, participant ownership, consent and governed service APIs |
| **My People** (future) | Preferred workers, credentials evidence, selected support circle, limited delegation | Authorised worker/provider evidence services; **never infer clearance** |
| **My Money** | Records of charges, funding explanations and participant invoice challenges | Existing billing/payment services; no new approval authority |
| **My Rights** | Complaints, incidents, safety, advocacy, correction and human support | Existing safety and engagement channels |
| **My Exit** (future) | Transition checklists and portable participant-controlled records | Existing contracts, export services and provider processes, if verified |

Shared MapAble Core services should own identity, consent, audit, notifications and policy enforcement. UI modules are clients of those services, not alternative registries.

## 5. Current implementation and evidence ledger

**Canonical repository:** [ausdisau/MapAble](https://github.com/ausdisau/MapAble)  
**My Support draft:** [PR #38](https://github.com/ausdisau/MapAble/pull/38), branch \`feature/my-support-sovereignty-web-native-v01\`.  
**My Day dependency reference:** [PR #32](https://github.com/ausdisau/MapAble/pull/32), draft and unmerged when reviewed on 10 November 2026.  
**Legacy imported web repository:** [ausdisau/mapableau-new](https://github.com/ausdisau/mapableau-new), for historical provenance; canonical development is in \`ausdisau/MapAble\`.

| Capability | Evidence path / record | Status as of document date |
| --- | --- | --- |
| Web My Support preview | \`apps/web/app/dashboard/my-support/page.tsx\` in PR #38 | **In development**: authenticated, server-flagged, read-only |
| Evidence labels | \`apps/web/lib/my-support/support-status.ts\` in PR #38 | **Implemented in draft code**, not independent service verification |
| Fictional decision practice | \`apps/web/components/my-support/DecisionWorkbenchPreview.tsx\` | **Synthetic/local-only**; not a real decision receipt |
| Expo mobile Support tab | \`apps/mobile/src/features/my-support/MySupportScreen.tsx\` | **Synthetic/local-only**; not live mobile care/consent integration |
| Preview flag | \`apps/web/lib/config/my-support.ts\` | Off unless server enables \`MAPABLE_MY_SUPPORT_PREVIEW_ENABLED=true\` |
| Existing care and transport records | Prisma \`CareBooking\` and \`TransportTrip\`; selected by signed-in \`participantId\` | Source record states; **not** delivery or worker-credential proof |
| My Day dependency evaluation | Draft PR #32, \`apps/web/lib/day/day-planner.ts\` and DayEval harness | Separate research prototype, not merged into My Support |
| Operational decision receipts | None established in PR #38 | **Proposed only** |
| Live native participant consent/worker actions | No such capability established in PR #38 | **Not implemented** |

PR #38's original implementation notes: [MY-SUPPORT-PARTICIPANT-CONTROL-V01.md](https://github.com/ausdisau/MapAble/blob/feature/my-support-sovereignty-web-native-v01/docs/product/MY-SUPPORT-PARTICIPANT-CONTROL-V01.md). Source references are snapshots and must be rechecked before any implementation claim.

## 6. Required UX and interaction patterns

### 6.1 Start with one genuinely participant-controlled question

The primary visual anchor is **"What matters to me / What can I decide?"**, not the provider roster or productivity score. Use an answerable, accessible next action; reveal complexity progressively. Keep the first screen compact on a phone and readable at high zoom.

### 6.2 The status card is evidence, not authority

A status card must provide a plain-English label, source, last update time, *what it proves*, *what it does not prove*, any needed follow-up and a visible route to the real authorised service.

Never replace ambiguous raw states with "ready", "verified", "safe" or "completed" solely because a service database contains a success-looking enum. A missing record is not proof that no external support exists.

### 6.3 Refusal-first design

Offer **Review**, **Decline**, **Seek another option**, **Ask a human** and **Not now** wherever applicable. Do not make "accept the provider's proposal" the only working action. Never dark-pattern people into disclosure or an AI-only pathway.

### 6.4 Decision receipts and acknowledgement chains — proposed

A decision receipt is **not merely an on-screen confirmation animation**. For a real implementation, separately capture:

- Participant's instruction and what it relates to.
- Actor identity and verified decision authority (or valid delegation).
- Consent scope and purpose, if applicable.
- Recipient, delivery attempt and acknowledgement state.
- Resulting external action, if any, with independent confirmation.
- Time, source, correlation/idempotency key, privacy-safe audit log.
- Dispute, correction, withdrawal and human escalation routes.

Example **conceptual** state machine (not the current database contract):

\`draft → participant_reviewed → instruction_submitted → acknowledged → action_verified\`

Add terminal or parallel states such as \`declined\`, \`withdrawn\`, \`disputed\`, \`delivery_failed\` and \`human_review_required\`. Do not jump automatically from submitted to completed. Irreversible external events cannot be rolled back merely by deleting a receipt.

### 6.5 Accessible care routine and handover

Let participants author accessible support instructions, including AAC method and response time, preferred routines, boundaries, and what an arriving worker needs to know. Worker views must be the **minimum authorised information for that shift**, ideally with an expiration/withdrawal policy that acknowledges prior disclosures cannot be unseen.

### 6.6 Participation integrity

Evaluate whether the participant's desired activity remained possible, not merely whether a worker clocked in. If a morning worker cancellation affects accessible transport and an appointment, preserve the dependency and help the participant consider options without auto-dispatch.

### 6.7 Contestable records and unmet support

Keep worker observations, participant reports, provider assertions, verified system events and disputed records distinguishable. Offer export and correction mechanisms with accountable human review. Do not generate a numerical value ranking a person's worth, independence or decision-making capacity.

## 7. Architecture and security pattern

**Read model first:** Query existing scoped APIs or read models. Web uses the current authenticated server session and server-side authorisation; native must not assume that the web session cookie can be reused.

**Separate five concepts in typed contracts:**

1. \`ParticipantIntent\`: chosen goal, preferences, boundaries and provenance.
2. \`SupportEvidence\`: source record, time, actor, verification level, uncertainty.
3. \`PermissionGrant\`: subject, scope, purpose, expiry, active/revoked state.
4. \`ActionProposal\`: proposed change, dependencies, risk and required approvers.
5. \`ExecutionReceipt\`: an independently observed, authorised outcome — **future only**.

A generated proposal is **not** an execution receipt. A consent checkbox is **not** proof of actual consent from an authorised person. A closed provider ticket is **not** proof that the participant has support.

Use immutable, minimally descriptive audit events for sensitive decisions; limit actor visibility by role, tenant and purpose. Guard against cross-tenant reads, implicit email-based identity linking, stale worker/vehicle claims, delegated-authority escalation, duplicate actions and non-idempotent retries.

**No new system-of-record tables or external writes in the first release slice.** A later operational schema requires a reviewed architecture decision, privacy impact assessment where warranted, data retention plan, escalation owner and migration/rollback review.

## 8. Accessibility and autonomy acceptance

Target WCAG 2.2 AA for web and mobile-relevant platform accessibility requirements; do not claim compliance without actual testing.

Test with disabled participants and the access technology they use, including keyboard, screen reader (VoiceOver/TalkBack), AAC, switch, enlarged text, 200–400% browser zoom/reflow, large touch targets, high contrast, reduced motion, low bandwidth, interruptions and session recovery.

**Core tests:** a participant declining a replacement; a worker cancelling; transport unsuitable or missing; AAC instructions unacknowledged; a delegate trying to exceed scope; consent withdrawn; stale record or ambiguous source; contradictory accounts of service delivery; a complaint; an urgent need without a verified replacement; and a non-AI/human-only route.

Accessibility is not only visual conformity: measure whether someone can **express, amend and enforce** a decision using their own communication method.

## 9. Rights, safeguarding and operating boundaries

Apply a disability-rights-led approach informed by supported decision-making, dignity of risk, informed consent, privacy, safe service continuity and Article 19 of the UN Convention on the Rights of Persons with Disabilities. Check current Australian/NSW and NDIS requirements for each service and transaction; a design document does not grant regulatory approval.

No autonomous worker credential determinations, emergency dispatch, medication decisions, restrictive practice approvals, provider suspension, financial charge approvals or high-impact legal advice. Human review is required where clinical safety, workforce safeguards, provider obligations, participant rights or unresolved service gaps are at stake.

Never describe support as a reward for compliance or services as privileges awarded by the algorithm.

## 10. Phased roadmap and release decision

| Increment | Primary deliverable | Gate |
| --- | --- | --- |
| **0 — Implemented draft** | Web read-only records, synthetic choices, Expo local Support screen | PR #38 remains draft; preview flag off |
| **1 — Co-designed read models** | Authorised, purpose-specific data, participant correction route, human help | Identity, privacy, consent and AAC usability review |
| **2 — Accountable decisions** | Server-owned receipt workflow with scoped commands and idempotency | Legal/contract checks, negative tests and human approval |
| **3 — Cross-provider continuity** | Dependency-aware recovery across Care + Transport | Verified partners, escalation owners and operator controls |
| **4 — Portability and challenge** | Record exports, service transition planning, dispute/complaints tracking | Review of agreements, sensitive data and continuity risks |

**Current recommendation:** GO for review of this documentation and draft preview; NO-GO for production activation, real worker changes, live decision receipts or mobile participant actions until separate checks and authorisations are complete.

## 11. Mandatory practice for every future MapAble feature

**This is the persistent engineering convention**. Whenever implementing or substantially changing a MapAble feature:

1. Open [FEATURE-DEVELOPMENT-MEMORY.md](../development/FEATURE-DEVELOPMENT-MEMORY.md) and the relevant feature dossier **before touching code**.
2. Establish the participant's goal, options, boundaries, communication needs, source-of-truth services, and a meaningful human fallback. Note who retains actual decision authority.
3. Inventory existing implementation, dependencies, feature flags, CI, Vercel deployment boundaries and source provenance.
4. Create or update a short feature dossier (\`docs/product/<feature>-docs.md\`, retaining exact user-requested filenames). Label every feature as verified live, in development, proposed, synthetic or unknown.
5. Include one normal and several adverse user journeys; test refusal, loss of consent, incomplete evidence, downstream cancellation and cross-role access.
6. Keep the first vertical slice narrow, default-disabled when it uses sensitive or unverified services, and reversible where possible.
7. Report actual tests, accessibility reviews and security checks, distinguishing code inspection from real-device/user validation.
8. Update the decision-and-evidence ledger and PR with what changed, what did not change, what remains blocked, and why.
9. Never merge, attach production domains, promote a deployment, enable privileged writes or claim release readiness solely because the feature is documented or a CI check is green.
10. Document the project's reusable lessons in the **Feature Development Memory**, excluding real participants' sensitive data.

A new feature is not *done* just because the UI renders: the participant must be able to understand the system, make or decline a choice, challenge an error, know what actually occurred and reach human help.

## 12. Relevant references and review history

- [My Support PR #38](https://github.com/ausdisau/MapAble/pull/38) — code and release boundaries; **draft**, not merged at document creation.
- [MapAble Day PR #32](https://github.com/ausdisau/MapAble/pull/32) — LifeVal-inspired synthetic planning and DayEval; **draft**, separate.
- [MapAble unified repository README](https://github.com/ausdisau/MapAble/blob/main/README.md) — canonical ownership and independent web/mobile dependency roots.
- [My Support implementation notes](https://github.com/ausdisau/MapAble/blob/feature/my-support-sovereignty-web-native-v01/docs/product/MY-SUPPORT-PARTICIPANT-CONTROL-V01.md) — snapshot of the draft code.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — reference for target digital accessibility evaluation.
- [CRPD Article 19](https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-persons-disabilities) — independent living and inclusion framing.
- [LifeVal preprint](https://arxiv.org/abs/2611.06687) — inspiration for personalised task/evidence evaluation; **not** disability-care safety certification.

**Review trigger:** each major release, any change to live decision authority, consent semantics, AI autonomy, native authentication or safety-critical support workflows. The development history and proof of implementation remain in GitHub; this document is not a substitute for current evidence.
