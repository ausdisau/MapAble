# MapAble Feature Development Memory

**Version:** 1.0  
**Date:** 10 November 2026 (Australia/Sydney)  
**Scope:** All MapAble features and connected products, web and mobile.  
**Status:** Proposed repository working agreement, submitted for review; not a claim that earlier PRs complied.

## Why this file exists

A conversation may not be available in the next coding session. A project memory **inside the repository** provides inspectable, version-controlled guidance for human contributors, Cursor and coding agents. This file records enduring decisions, their evidence and recurring rules; it **is not** ChatGPT's personal Memory service and must not contain personal or sensitive information about participants.

Read this file before scoping new work, and update its feature register and lessons whenever a feature PR changes a significant architectural, rights or safety assumption.

The full participant-control doctrine is [MySupports-docs.md](../product/MySupports-docs.md). It applies beyond the My Support screen.

## Permanent non-negotiable feature contract

Every new MapAble feature should answer:

1. **Participant value:** What goal does it help a person pursue? Can they opt out, refuse, correct or choose a non-digital alternative?
2. **Decision authority:** Who can request, approve, execute, reverse or challenge each consequential action? What is the evidence of delegation?
3. **Communication access:** What AAC, language, response-time, keyboard, screen-reader, switch, cognitive and low-bandwidth paths are required?
4. **Truthfulness:** Which statements are confirmed by real external evidence, recorded only in a database, synthetic, unknown or disputed?
5. **Consent and privacy:** What minimum data is needed, for which purpose, for how long, and what happens upon revocation?
6. **Source of truth:** Which existing service owns the record, identity, billing, consent, messages, audit and recovery? Prevent duplicative authorities.
7. **Disruptions:** What if the provider cancels, transport fails, the worker is unsuitable, a dependent service is unavailable or the model is wrong?
8. **Accountability:** What receipt, correction, dispute and human escalation route exists? A submitted request is not a completed external action.
9. **Evidence:** What test, manual assessment, version, source, approval and deployment record supports claims of readiness?
10. **Release:** What remains explicitly off? Who may authorise deployment, and what is the rollback/containment plan?

**Defaults:** participant authority, explicit consent, non-AI/human fallback, minimum disclosure, reliable audit, fail-closed uncertainty, no autonomous high-impact action, no production activation from a draft.

## Standard feature lifecycle

| Stage | Required artefact | Gate before moving forward |
| --- | --- | --- |
| Discover | Real problem statement, target user journeys and evidence ledger | Distinguish sources from hypotheses |
| Audit | Repo/PR map, current auth/data model, flags, CI and Vercel project scope | Confirm canonical repo and avoid replacing existing authorities |
| Design | Feature dossier + accessible flow + permissions and refusal branches | Participant decision, human help and failure paths visible |
| Implement | Narrow guarded vertical slice, source-controlled changes | No leaked participant data, unintended writes or secret exposure |
| Test | Deterministic tests + privacy/security negative cases + assistive-tech plan | Automated results *and* outstanding manual testing honestly reported |
| Review | Draft PR with decision log, screenshots if obtained and changed-files list | Human/code-review, consent/security/accessibility issues addressed |
| Release | Protected preview, documented approval, verified deployment SHA | Production go/no-go by an authorised human; never assume deployment |
| Learn | Outcome, post-release observations, discrepancies and updated memory | Record evidence, do not invent success metrics |

## The feature dossier convention

Create or update a durable Markdown document for **every significant user-facing feature**. Use the user-specified filename when provided, otherwise `docs/product/<feature-slug>-docs.md`.

Required headings:

~~~markdown
# Feature name — Design, Implementation and Rights Record

**Product owner:** [role/team]
**Repository / branch / PR:** [verified links]
**Updated:** YYYY-MM-DD
**Status:** verified live | implemented unverified | in development | proposed | exploratory | historical

## Participant outcome
## User journeys: ordinary, refused, cancelled, disputed and offline
## Options, decision rights, consent and delegation
## AAC, assistive technology and accessible human support
## Sources and claims: evidence ledger with timestamps
## Architecture and systems of record
## Data model and privacy/security constraints
## Design patterns, UI states and cross-device behaviour
## Risk, negative cases and recovery pathways
## AI authority boundary (if any)
## Tests: command, commit SHA, actual result and untested areas
## Preview, rollout, rollback and human approvals
## Known gaps, next decision and operating owner
## Change log / decisions / contradictions
~~~

For multi-platform features, document what web does **versus** what Expo/React Native actually implements; a web screen does not prove native parity, and Vercel does not build native App Store binaries.

## Standard PR description: declaration of intent and evidence

Use a short structure in PR bodies:

- **Purpose and participant impact** — whose choice, control or continuity improves?
- **What shipped in code** — source paths and feature flags.
- **What did not ship** — fake/synthetic, disabled, missing external capability.
- **Source-of-truth** — existing APIs, session owner and tenant/permission boundary.
- **Evidence** — test commands/results, screenshots, review notes, inspection date.
- **Safeguards** — consent withdrawal, refusal, stale data, AAC, human escalation.
- **Risk gates** — accessibility, security, privacy, legal/regulatory, operations.
- **Release** — preview vs production GO/NO-GO, exact SHA and human authorisation.
- **Memory update** — the reusable design decision and link to the feature dossier.

Do not substitute "CI green" for a complete participant-led safety/usability review. Never resolve a real-data security weakness by changing the UI label alone.

## Design language and component inheritance

Carry forward these reusable patterns:

| Pattern | Meaning | Example |
| --- | --- | --- |
| **Participant-first hierarchy** | One primary question; clear decisions before provider administration | "What would you prefer?" |
| **Refusal-first control** | Real decline and human options, not a decorative cancel button | Decline replacement without closing the unmet need |
| **Proof-carrying status** | Evidence source, freshness, caveat and path to verify | "Worker assigned in record; screening not proven" |
| **Decision receipt** | Instruction, authority, delivery/acknowledgement and actual outcome remain distinct | Refusal submitted vs provider acknowledged |
| **Continuity graph** | Disruptions affect dependent services, not the whole person's day | Cancelled worker → transport at risk |
| **Contestable record** | Preserve participant account and disputed evidence | Completion claimed vs participant disagrees |
| **Minimum-necessary sharing** | Scoped, revocable access, no automatic family entitlement | Shift-limited worker brief |
| **Quiet-by-default attention** | Notify only when decisions or disruptions materially require attention | No repeated check-ins for an ordinary day |
| **Human and non-AI parity** | Accessible path without model involvement or app reliance | Human coordinator pathway |

All colour systems must be checked for actual contrast, not just consistent branding. Use WCAG 2.2 AA as the web target, with manual testing; iOS VoiceOver, Android TalkBack, switch, AAC and text enlargement need device-specific review.

## Durable feature register — living snapshot

| Feature | Dossier / evidence | Implementation and release state at 2026-11-10 | Next evidence needed |
| --- | --- | --- | --- |
| **My Support** | [MySupports-docs.md](../product/MySupports-docs.md), [PR #38](https://github.com/ausdisau/MapAble/pull/38) | Draft web/native preview; web flag off by default, native choice exercise synthetic; no production proof | CI at latest SHA, participant-led access review, privacy/security and protected preview |
| **My Day** | [PR #32](https://github.com/ausdisau/MapAble/pull/32) | Draft LifeVal/DayEval research preview; separate from My Support; not merged | Review tests at latest SHA, consent/integration boundaries and usability |
| **Cross-provider decision receipts** | Proposed within My Support dossier | Design only; no live execution authority | Decision rights matrix, typed contract, legal/operational review |
| **Participant transition / portability** | Proposed within My Support dossier | Design only; not a verified end-to-end provider migration | Agreement checks, data portability analysis, continuity review |

Update **only when verified**. Keep historical entries visible when assumptions change; link the new evidence and date.

## Architecture and release boundaries

- **Canonical:** `ausdisau/MapAble`; `apps/web` (Next.js/React 18) and `apps/mobile` (Expo/React Native/React 19) have separate dependency roots. Preserve these until an explicitly reviewed migration.
- **Legacy:** `ausdisau/mapableau-new` is the imported predecessor; do not make it a second canonical repository.
- **Authoritative controls:** Reuse existing NextAuth web session, delegated permissions, consent and service-owned data. Never infer native auth from web session cookies.
- **Hosted preview:** Use a protected, isolated Vercel preview with verified project/repo/root-directory mapping and appropriate test data; do not alter `mapable.com.au`, production aliases, or shared database credentials without explicit approval.
- **Sensitive capabilities:** Default off, with separate risk/authorization gates for dispatch, payment, identity changes, sharing and AI-driven actions.
- **AI:** Structured proposals and explanations may assist; deterministic authorised services execute. Preserve accessibility and manual alternatives.

## Memory update procedure for every PR

1. Read this file and the feature dossier.
2. Add a dated note to the feature dossier whenever the purpose, source of truth, authority, consent, accessibility, evidence or release assumption changes.
3. Add or update one concise row in the feature register, with exact PR and verification status.
4. Capture any reusable pattern in the inheritance table. Do not add one-off implementation trivia to permanent rules.
5. Note unresolved contradictions rather than silently rationalising them.
6. Keep participants' identifiers, medical details, passwords, secrets, raw audit trails and sensitive records **out** of this public repository.
7. Link the documentation change from the draft PR so future assistants can reconstruct the reasoning from code and evidence.
8. Treat user preferences recorded through ChatGPT Memory as a separate product feature. A repository document cannot by itself alter a user's personal Memory settings.

## Definition of done

A feature is **reviewable** when its changes, evidence and constraints are explicit. It is **releasable** only when the applicable technical, security, privacy, accessibility, rights, operational and human-approval gates have been completed. It is **successful** only when participant outcomes are validated, without scoring personal worth or treating reduced support usage as inherently positive.

**Project memory sentence to carry forward:** *For every MapAble feature, design for participant control of choices, consent, evidence, refusals and accountability; preserve AAC and human alternatives; reuse existing core authorities; provide a feature dossier, failure-case tests and explicit release gates; record decisions and proof in the repository without turning prototypes into production claims.*
