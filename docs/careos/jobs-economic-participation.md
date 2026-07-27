# CareOS Phase 10 — Jobs and Economic Participation

Phase 10 adds participant-controlled employment profiles, transparent job match explanations, employer accessibility evidence (separate from marketing claims), and disclosure-gated applications. Existing ATS flows under `app/employer/` and `app/employment/` are reused — this phase does not duplicate employer pipelines.

## Fairness boundaries (hard)

CareOS **must NOT**:

- Compute employability scores
- Reject applicants automatically
- Infer capability from disability
- Rank candidates by productivity
- Share disability or adjustment information without participant consent

These are enforced in `lib/jobs/fairness-boundaries.ts` and hardcoded off in `lib/config/jobs-participation.ts`.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_JOBS_PARTICIPATION_ENABLED` | `false` | Master switch for participant jobs participation |
| `MAPABLE_JOBS_MATCHING_EXPLANATIONS_ENABLED` | `false` | Transparent requirement/adjustment explanations |
| `employabilityScoringEnabled` | **hardcoded `false`** | No employability scoring |
| `automaticApplicantRejectionEnabled` | **hardcoded `false`** | No automatic rejection |
| `disabilityInferenceEnabled` | **hardcoded `false`** | No disability-based capability inference |
| `productivityRankingEnabled` | **hardcoded `false`** | No productivity ranking |

## Schema (migration `20260714110000_jobs_participation`)

New models:

- `EmploymentProfile` — skills, interests, work preferences, communication/adjustment/disclosure choices
- `EmploymentGoal` — participant employment goals (not scores)
- `EmployerAccessibilityEvidence` — verified evidence vs `EmployerAccessibilityCommitment` claims
- `WorkplaceLocation` — employer workplace sites
- `WorkplaceAccessibilityEvidence` — location-specific accessibility evidence
- `JobRequirement` — structured job requirements for explanation matching
- `JobMatchExplanation` — transparent matched/not-matched/unknown breakdown
- `ApplicationDisclosurePreview` — participant preview of employer-visible fields

`Job.workplaceLocationId` links jobs to workplace locations.

## Module layout

```
lib/jobs/
  fairness-boundaries.ts
  participants/employment-profile-service.ts
  goals/employment-goals-service.ts
  matching/match-explanation-service.ts
  applications/participant-application-service.ts
  disclosure/disclosure-preview-service.ts
  evidence/employer-evidence-service.ts
lib/config/jobs-participation.ts
app/participant/jobs/          — participant hub
components/jobs/               — accessible panels
app/api/participant/jobs/      — participant APIs
```

## Key APIs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET/PATCH | `/api/participant/jobs/profile` | Employment profile |
| GET/POST/PATCH | `/api/participant/jobs/goals` | Employment goals |
| GET | `/api/participant/jobs/matches` | List match explanations |
| GET/POST | `/api/participant/jobs/matches/[jobId]` | View/generate explanation |
| GET/POST | `/api/participant/jobs/applications` | List/create applications |
| GET/PATCH/POST | `/api/participant/jobs/applications/[applicationId]` | View/correct/submit/request adjustment |
| GET/PATCH/POST | `/api/participant/jobs/applications/[applicationId]/disclosure-preview` | Disclosure preview |
| POST | `/api/participant/jobs/applications/[applicationId]/withdraw` | Withdraw application |

`GET /api/jobs/[jobId]` includes requirements and accessibility evidence when participation is enabled.

## Participant application flow

1. Build or update employment profile and goals.
2. Optionally generate a match explanation (no ranking).
3. Create a draft application (reuses `lib/jobs/job-service.ts`).
4. Preview disclosure — confirm what the employer will see.
5. Submit application (blocked until disclosure preview is confirmed).
6. Withdraw, correct, or request interview adjustments at any time before final employer decision.

## Validation

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/mapable
export DIRECT_URL=postgresql://user:password@localhost:5432/mapable
pnpm prisma validate && pnpm prisma generate
pnpm vitest run tests/jobs
```
