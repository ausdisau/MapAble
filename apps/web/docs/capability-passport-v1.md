# MapAble Capability Passport + Skills Bridge v1

**Status:** Implemented on a stacked draft feature branch; not independently verified live or deployed.
**Repository:** `ausdisau/MapAble`
**Base:** Support Builder PR #45 (`feature/provider-finder-support-builder-ai-sdk-neon-20261117`)
**Controls:** `MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED=false` by default. Routes and pages also **hard-deny Vercel production** even if the env flag is true.
**Depends on (independent, still default-off):** `MAPABLE_CAREOS_WORKFORCE_PASSPORT_ENABLED`, `TRUST_PASSPORT_PILOT_ENABLED`, existing Academy / worker-training modules, `MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED` for the 0137 pack only.
**Non-claims:** MapAble is **not** NDIS registered, accredited, compliant, or production-ready because of this slice. Training is not demonstrated competence. Worker screening clearance is not a general safety guarantee.

## 1. Architecture

Capability Passport is a **workflow overlay** on existing evidence tables (`WorkerProfile`, `WorkerCredentialEvidence`, `WorkerCompetencyEvidence`, `WorkerTrainingCompletion`, `ProviderAcademyEnrollment`, `AcademyCompetencyProposal`, `WorkerTrustCredential`). It does **not** create a second identity or training database.

New overlay models (unapplied migration `prisma/migrations/20261117120000_capability_passport_v1`):

| Model | Purpose |
| --- | --- |
| `WorkerScreeningRecord` | Official NDIS screening outcome, expiry, nullable eligible-to-work, identity linkage, verifying organisation, authorised reviewer, source |
| `CapabilityReviewCase` | Assessor workflow: kind, evidence IDs, scope, policy version, optional participant scope, decision, accountable human, limitations, legal-prohibition flag |
| `WorkerEvidenceDispute` | Worker correction of a specific evidence row |
| `WorkerPassportSharePreference` | What the worker shares with providers vs participants |

Engines (deterministic, explainable; **no percentage readiness score**):

- `lib/workforce/evidence-selection.ts` — documented pick rule (also repaired in `@mapable/domain-workforce`)
- `lib/workforce/skills-gap.ts`
- `lib/workforce/learning-catalog.ts` — Academy `SAFEGUARDING-101` / `ACCESSIBILITY-101`, platform training module, official NDIS framework **links only**
- `lib/workforce/task-readiness.ts` — extends evidence eligibility without auto-assign/booking
- `lib/workforce/screening-gateway.ts` — official outcome vocabulary; default **NOT INDEPENDENTLY VERIFIED**
- `lib/workforce/platform-0137-rules.ts` — default-off; applicability unverified pending counsel
- `lib/workforce/ai-explain.ts` — optional labelled summary of **already computed** gaps; no writes

```
Worker UI → skills-gap / readiness / screening gateway
Skills Bridge → Academy + training catalog + official references
Assessor Capability Review → existing evidence IDs
AI explain → copy only (no writes)
```

## 2. Permission matrix

| Actor | Can see | Can write | Cannot |
| --- | --- | --- | --- |
| Worker (own `WorkerProfile.userId`) | Own passport | Disputes, share prefs, request assessment | Other workers; official clearance |
| Provider (`worker:manage:org` + same org) | Org-purpose evidence | Propose pending competency | Cross-tenant; self-approve as assessor of self |
| Assessor (`verification:manage:org` / `assessor:portal` / `verification:manage:any`) | Delegated cases | `hold`, `request_evidence`, `refer_for_assessment`, `escalate`, limited approve/reject | Self-approval; override Exclusion / participant blocks |
| Participant | Limited readiness reasons only | None | Full files, screening numbers, clinical detail |
| AI | Optional explanation of computed gaps | **None** | Clearance, competence, task authorisation |

Cross-tenant requests 403. Production requests 404.

## 3. Evidence-state definitions

| State | Meaning |
| --- | --- |
| `satisfied_by_current_evidence` | Best current **verified**, non-expired, non-revoked record was selected |
| `training_recommended` | Learning may help; enrolment ≠ completion ≠ competence |
| `assessment_required` | Training or pending evidence exists; practical competence is not assessed |
| `verification_required` | Record missing or not independently verified (includes mock claims) |
| `expired_or_revoked` | Best selected record is expired or revoked |
| `not_applicable` | Requirement not in scope |
| `human_review_required` | High intensity, participant block, or legal prohibition |

**Pick rule:** prefer current verified non-expired non-revoked, then pending, never let revoked/expired outrank a valid record. Missing stays unknown/blocked.

Official screening outcomes: `clearance`, `pending`, `interim_bar`, `exclusion`, `suspension`, `no_valid_clearance`, `not_independently_verified`. Default display: **Current screening status: NOT INDEPENDENTLY VERIFIED**. Eligible-to-work is **nullable and never inferred**. Never infer clearance from screenshots, applications, provider relationship, mock presentations, academy enrolment, or absence of banning orders. **No Worker Screening Database access.**

## 4. Consent / purpose map

| Purpose | Data | Audience |
| --- | --- | --- |
| Worker self-management | Full passport minus raw document bytes / unmasked numbers | Worker |
| Provider workforce admin | Pending proposals for their organisation | Provider admin in org |
| Capability review | Case + linked evidence IDs | Delegated assessor |
| Participant matching | Limited reasons only | Participant |
| Audit | Action, entity, org, participant id, redacted metadata | Compliance |

Audit never logs documents, full screening numbers, or clinical detail.

## 5. Regulatory traceability (source → policy → control → evidence → human → test → gap)

| Official source | Policy in this slice | Control | Evidence | Human | Test | Residual gap |
| --- | --- | --- | --- | --- | --- | --- |
| NDIS Practice Standards (worker screening / training) | Training ≠ competence; screening ≠ general safety | Academy propose pending only; identity binding; Skills Bridge copy | `WorkerTrainingCompletion`, academy enrollment | Assessor verify | `capability-passport-v1.test.ts` cases 1–2 | No live NDIS Commission connection |
| NDIS Worker Screening outcomes | Official enum; default not independently verified | `WorkerScreeningRecord` + screening gateway | Overlay table, unapplied | Authorised reviewer | mock ≠ clearance; Exclusion not overridable | **No lawful screening portal**; cannot confirm a live clearance |
| NDIS Workforce Capability Framework | Linked official reference only | Learning catalog URLs; not reproduced | Link + currency note 17 Nov 2026 (Sydney) | Human assessment still required | learning catalog AI-off | Licence/currency must be re-checked before any public use |
| High Intensity Support Skills Descriptors | High-intensity always `human_review_required` | skills-gap + catalog disclaimer | Link only | Professional assessor | high-intensity test | Completing a module must never authorise HISSD tasks |
| NDIS digital platforms / 0137 (page updated 8 Sep 2026; registration from **1 July 2026**) | Finder/care surfaces do **not** automatically meet “main purpose connecting NDIS plan supports **and** processing NDIS payments” | `platform-0137-rules.ts` default-off behind `MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED` | Flag + reason codes | Counsel | 0137 default-off test | **Applicability unverified pending counsel**. Do not apply clearance-before-offer to every worker |

## 6. Security audit (Phase 0) — defects repaired

| Defect | Repair |
| --- | --- |
| Academy propose accepted `enrolled` as well as `completed` | Only `completed` + `completedAt`; `ENROLLED_NOT_COMPLETED` |
| Enrollment `userId` not bound to worker | Must equal `WorkerProfile.userId`; `IDENTITY_NOT_BOUND` if missing |
| Training completion `userId` not checked | `IDENTITY_MISMATCH` |
| Verify trusted client `verifiedByUserId`, non-atomic, any admin, no self-approval block | Session assessor, `$transaction`, org/delegated permission, `SELF_APPROVAL_FORBIDDEN` |
| Mock issuer wrote `verified` onto `WorkerProfile` | Claims `mock_unverified` / `not_independently_verified`; `verifyPresentation` does **not** update screening/WWCC/first-aid/insurance/verification fields |
| Evidence `.find()` first-row wins | Deterministic best-record selection |
| Screening vocabulary overloaded `WorkerCredentialStatus` | Separate official outcome enum + gateway |

## 7. AI limits

- Optional Vercel AI SDK summary of **already computed** gaps.
- Labelled “AI explanation”.
- Structured non-AI copy always available (Skills Bridge).
- Review API rejects `issuedByAi` / `screeningOutcome` bodies.
- `AI_EXPLAIN_WRITE_PERMISSION = false`.
- AI must not issue regulatory clearance, fabricate credentials, independently certify competence, or authorise a task.

## 8. Rollback

1. Keep `MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED=false` (and production hard-deny).
2. Do **not** run `prisma migrate deploy` for `20261117120000_capability_passport_v1` on production.
3. If a preview database applied it: `prisma migrate resolve --rolled-back 20261117120000_capability_passport_v1`, DROP overlay tables/types, or restore the preview branch.
4. Revert this stacked branch onto Support Builder.

## 9. Unresolved-risk register

| Risk | Rating | Why it remains |
| --- | --- | --- |
| No lawful Worker Screening Database / portal access | High | Cannot confirm official outcomes; default remains NOT INDEPENDENTLY VERIFIED |
| Preview Neon branch for this overlay does not exist | High | Treat as **blocker** for live preview data, not a silent skip |
| 0137 applicability | High | Unverified pending counsel; flag off |
| Unreviewed high-risk care decisions | High | High-intensity always human review; no auto-assign |
| Unverifiable credentials | Medium | Missing evidence stays unknown |
| Incompatible Neon schema until overlay is applied on a disposable preview | Medium | Unapplied migration only |
| Booking eligibility still uses legacy `workerScreeningStatus === "verified"` when passport flag is off | Medium | Default-off overlay; do not silently change production booking |

## 10. GO / NO-GO

- **GO** for isolated, flagged, stacked-draft **preview and evaluation only**, after CI on this branch.
- **NO-GO** for production, live screening, public worker matching, enabling flags, or applying migrations.

## 11. Journeys (preview)

Worker: `/dashboard/worker/capability-passport` — screening, qualifications, training, competencies, Skills Bridge, disputes, sharing.
Assessor: `/admin/ops/safeguarding/capability-review` — cannot self-approve; cannot override Exclusion.
Participant: `GET /api/workforce/passport/participant-summary` and Relational Fit limited-reason copy when this flag is also on.
Mock trust passport: present-only; copy states mock ≠ clearance.
