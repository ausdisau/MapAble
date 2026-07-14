# CareOS Phase 11 — Quality, Accreditation and Compliance Cloud

Phase 11 adds a provider Quality Management System (QMS) with versioned standards, audits/corrective actions, policy/training acknowledgements, and provider accreditation applications. Existing **Access Mark** venue accreditation (`AccessAccreditation*` models, `lib/access-accreditation/*`, `components/access-accreditation/*`) is reused — not rebuilt. Provider accreditation optionally links an `AccessAccreditationAssessment`.

## Safety boundaries (hard)

CareOS **must NOT**:

- Automatically decide provider accreditation outcomes
- Derive provider quality scores from participant incidents
- Silently overwrite audit or corrective action history

Enforced in `lib/quality/compliance-boundaries.ts` and hardcoded off in `lib/config/quality-accreditation.ts`.

**Human assessors make accreditation decisions** — CareOS only prepares evidence indexes.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_QUALITY_QMS_ENABLED` | `false` | Master switch for provider QMS |
| `MAPABLE_PROVIDER_ACCREDITATION_ENABLED` | `false` | Provider accreditation applications |
| `automaticAccreditationDecisionEnabled` | **hardcoded `false`** | No auto accreditation decisions |
| `participantIncidentToProviderScoreEnabled` | **hardcoded `false`** | No incident-derived provider scores |

## Schema (migration `20260714120000_quality_accreditation`)

### Standards registry (versioned, source attributable)

- `StandardFramework`, `StandardOutcome`, `StandardIndicator`, `EvidenceRequirement`
- `ComplianceEvidence` (versioned with supersession chain)
- `EvidenceAssessment`

### Audits & improvement (immutable history)

- `QualityAuditPlan`, `QualityAuditFinding`, `CorrectiveAction`, `ImprovementAction`
- Append-only: `QualityAuditFindingHistory`, `CorrectiveActionHistory`, `ImprovementActionHistory`

### Policies & training (distinct from worker competency)

- `PolicyDocument`, `PolicyAcknowledgement`
- `TrainingRequirement`, `TrainingCompletionRecord` (not `WorkerTrainingCompletion`)

### Provider accreditation

- `ProviderAccreditationApplication` (optional `accessAccreditationAssessmentId`)
- `ProviderAccreditationApplicationEvidence`
- `ProviderAccreditationAssessment` (evidence index for human assessors)
- `ProviderAccreditationClarification`
- `ProviderAccreditationDecision` (human only)
- `ProviderAccreditationAppealRecord`
- `ProviderAccreditationApplicationEvent`

Access Mark models remain unchanged.

## Module layout

```
lib/quality/
  compliance-boundaries.ts
  dashboard-service.ts
  standards/standards-service.ts
  audits/audit-service.ts
  policies/policy-service.ts
lib/accreditation/
  provider-accreditation-service.ts
lib/config/quality-accreditation.ts
app/provider/quality/           — provider QMS hub
app/admin/accreditation/        — assessor review queue
components/quality/             — shared UI
app/api/provider/quality/       — provider APIs
app/api/accreditation/          — accreditation APIs
```

## Key APIs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/provider/quality/dashboard?organisationId=` | QMS dashboard metrics |
| GET/POST | `/api/provider/quality/standards` | Frameworks & compliance evidence |
| GET/POST | `/api/provider/quality/audits` | Audit plans, findings, corrective actions |
| GET/POST | `/api/provider/quality/policies` | Policies, acknowledgements, training records |
| GET/POST | `/api/accreditation/applications` | Provider applications & assessor actions |

Assessor-only actions (`prepare_evidence_index`, `request_clarification`, `record_decision`) require admin role.

## Access Mark integration

- Venue accreditation continues at `/admin/access/accreditation` using `lib/access-accreditation/*`.
- Provider applications may set `accessAccreditationAssessmentId` to reference a published Access Mark assessment.
- `ComplianceEvidence.sourceType` includes `access_mark` for cross-linking evidence.

## Tests

```bash
npx vitest run tests/quality tests/accreditation
npx prisma validate
```
