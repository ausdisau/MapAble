# Participant-controlled support worker matching — synthetic evidence preview

**Status:** In development, synthetic demonstration only. **Parent:** draft dashboard PR #26, head `feat/participant-contextual-dashboard-hireup-study-20261108`.

## Decision and scope

Introduce the next participant-first dashboard slice without claiming production worker matching, live screening, provider identity validation, shift availability, or AI model capability. The preview uses only fictional workers in client-side memory, is off by default, and is forcibly unavailable in production even if its flag is set.

### Sources / provenance

- NDIS Commission: https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants (authorised Self-managed participants portal and NWSD; read current status there, not via public search).
- NDIS Commission: https://www.ndiscommission.gov.au/workforce/worker-screening (as of 12 October 2026, registered/deregistered providers use the new Commission portal; self-managed participants and unregistered providers continue with their existing portal).
- NDIS Commission: https://www.ndiscommission.gov.au/provider-registration/find-registered-provider (provider registration only, independently of any worker).
- NDIA: https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder (registered-provider directory, not a worker list).
- NDIA: https://www.ndis.gov.au/participants/working-providers/finding-providers/how-find-and-choose-provider (NDIA-managed funding generally requires a registered provider; plan-managed/self-managed generally have broader choice, subject to exceptions).
- MapAble's current `/dashboard/find-support` continues to use `searchCareProviders`, a provider-level search. It does not provide verified screening or availability for individual workers.
- Hireup public-reference analysis: `docs/design/participant-contextual-dashboard-hireup-study.md`. No Hireup production code or worker data is imported.

## State and provenance model

Do not conflate:
1. **Provider registration:** current official NDIS registration status, ABN, registration groups; no worker-level inference.
2. **Worker screening:** authorised NWSD status `Clearance`, `Pending`, `Interim bar`, `Exclusion`, `Suspension`, `No valid clearance` only when actual authorised evidence is available. Without such evidence show `Not independently verified`. The fictional preview **never** asserts actual clearance.
3. **Competence:** task-specific current training, assessment/supervision and scope. Screening is not competence.
4. **Availability:** current working windows, conflicts and worker consent. Schedule declarations are not confirmed availability.
5. **Communication/access:** functional AAC/communication support and sufficient response time; do not infer from diagnosis or use disability as a risk score.
6. **Continuity:** participant-marked preferred/familiar worker, not inferred intimacy or a relationship score.

Participant exclusion / do-not-consider choices are respected in this UI. Restricted screening statuses cannot be progressed in the fictional preview. All candidates have `canBook=false`, `verifiedScreening=false`, `verifiedCompetence=false`, `confirmedAvailability=false`, `humanReviewRequired=true`. There are no numeric match scores, ranked workers or automatic substitutions.

## Delivery wiring

- Route: `/dashboard/matching-preview`
- UI: `components/matching/ParticipantMatchingPreview.tsx`
- Deterministic explanation: `lib/matching/participant-preview.ts`
- Hard-disabled outside development/test: `lib/matching/participant-preview-config.ts`
- `MAPABLE_PARTICIPANT_WORKER_MATCHING_PREVIEW_ENABLED` defaults to false and requires `NODE_ENV !== "production"`.
- Navigation link in the new consolidated left sidebar and entry from `/dashboard/find-support` only when enabled.
- No new API endpoints, worker lookup, database migrations, outbound network requests, identity delegation, or writes.

## Access, privacy and governance

- The page requires an authenticated participant role or an administrator reviewing a fictional demo. No real participant profile is queried and no role is impersonated.
- Consent for future worker matching, disclosure to a provider/worker, delegate participation, and AI processing must be scoped separately. No consent is created or modified here.
- No credentials, identity documents, diagnoses, protected worker data or NDIS numbers enter the preview.
- Keep historical/fictional evidence distinct from real official evidence. An uploaded screenshot of a clearance is not an automatically verified current status.
- A valid screening status is never described as proof of safety, trustworthiness or personal fit. Unregistered providers and screening rules require jurisdiction- and funding-specific lawful interpretation.
- Preserve human escalation if no suitable worker exists, a shift is cancelled, or support includes complex/high-intensity tasks.

## Gates before real provider/worker integrations

1. Define lawful participant-to-provider/workforce data boundaries and rights to access individual worker records; do not inherit an organisation membership requirement that excludes unaffiliated participants.
2. Use official Provider Register/NDIA data for provider-level facts with ABN, update time and clear Demo/Declared/Official distinctions. Never auto-join a worker to a provider on a name guess.
3. Use an authorised NWSD verification path for *individual* workers. Never scrape/reproduce portal data without permission. Record status freshness and revocation checks.
4. Verify competence, licensing, task scope, availability, worker acceptance and workplace arrangements independently.
5. Keep participant choice, consent revocation, preferred worker continuity, AAC, manual handling and human fallback operational before considering any matching or bookings.
6. Complete DPIA, NDIS regulatory review, provider/worker fairness evaluation, role-scoped API security tests, incident/complaint controls, accessibility co-design and independent pilot approval.
7. Audit the existing `lib/matching/matching-service.ts` override logic and candidate actions before any reuse; this preview intentionally does not call it.

## Acceptance / tests

Run targeted Vitest for the deterministic preview and require full lint, build, role, keyboard, screen-reader, 200–400% reflow, AAC/switch, consent-denial, flag-off and production-disabled checks before merge. WCAG 2.2 AA is a design target, not a verified claim. The structural GitHub workflow alone does not establish these results.

No production deployment, provider integration, screening verification or live matching is authorised by this draft.
