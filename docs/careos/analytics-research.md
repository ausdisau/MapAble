# CareOS Phase 14 — Analytics, Research and Evaluation Cloud

Phase 14 delivers a privacy-preserving analytics cloud, governed research exports, and an AI evaluation harness. It extends existing `lib/analytics/*`, privacy-preserving analytics, federated research, and admin analytics — without participant worthiness or risk scores.

## Feature flags

| Env var | Default | Purpose |
|---------|---------|---------|
| `MAPABLE_ANALYTICS_CLOUD_ENABLED` | `false` | Metric registry, events, snapshots, analytics exports |
| `MAPABLE_RESEARCH_GOVERNANCE_ENABLED` | `false` | Research projects, ethics, consent, cohorts, exports |
| `MAPABLE_AI_EVALUATION_HARNESS_ENABLED` | `false` | Synthetic AI evaluation scenarios |

Hardcoded (never enable via env):

- `participantWorthinessScoreEnabled = false`
- `participantRiskScoreEnabled = false`

## Architecture

- **Metric registry**: `lib/platform/analytics/metric-registry.ts` — extends `lib/analytics/` with governed metric definitions, events, and snapshots.
- **Privacy / de-identification**: `lib/platform/privacy/deidentification/` — field suppression, pseudonymisation, small-cell controls. Never claims "anonymous" without documented basis.
- **Exports**: `lib/platform/privacy/exports/` — analytics and research export approval workflows, withdrawal effects.
- **Research domain**: `lib/research/` — projects, ethics approvals, DUAs, consent, cohorts, publications.
- **AI evaluation**: `lib/intelligence/evaluation/` — harness for hallucination, authority bypass, clinical boundary, safeguarding, leakage, prompt injection, unfair recommendations, tool misuse, AI-disabled.

## Data models

Migration `20260714150000_analytics_research`:

| Model | Purpose |
|-------|---------|
| `MetricDefinition` | Registered metrics with dimensions |
| `MetricDimension` | Slice keys for a metric |
| `AnalyticsEvent` | Raw events (pseudonymised participant refs only) |
| `MetricSnapshot` | Aggregated values with small-cell suppression |
| `AnalyticsExport` | Governed analytics export with approval |
| `ResearchProject` | Research study with governance lifecycle |
| `EthicsApproval` | Ethics committee approval record |
| `DataUseAgreement` | Partner data use agreement |
| `ParticipantResearchConsent` | Per-participant consent |
| `ResearchCohort` | Defined cohort with suppression metadata |
| `ResearchExport` | Governed research data export |
| `ResearchWithdrawal` | Participant withdrawal — blocks exports |
| `PublicationRecord` | Publication acknowledgement |

## Privacy rules

1. **Field suppression** — names, emails, addresses, clinical notes, safeguarding narratives, and identifiers are always stripped from exports.
2. **Pseudonymisation** — participant IDs replaced with irreversible SHA-256 tokens; exports describe technique, not "anonymous".
3. **Small-cell controls** — cohorts below threshold (default 5) are suppressed to prevent re-identification.
4. **Export approval** — analytics and research exports require explicit approver action.
5. **Withdrawal effects** — participant withdrawal blocks pending exports and flags data for purge.

## AI evaluation harness

Scenarios (synthetic only):

| Scenario | Expected outcome |
|----------|------------------|
| `hallucination` | Refuse or escalate unsourced clinical claims |
| `authority_bypass` | Deny actions without authority |
| `clinical_boundary` | Route clinical content to human review |
| `safeguarding` | Escalate safeguarding signals |
| `leakage` | Suppress PII in outputs |
| `prompt_injection` | Reject injection attempts |
| `unfair_recommendations` | Block participant scoring |
| `tool_misuse` | Require approval for tool calls |
| `ai_disabled` | Fail closed when AI disabled |

Admin UI: `/admin/ai-evaluation`

## UI surfaces

- `/admin/analytics` — metric registry, exports, research projects, evaluation panel
- `/admin/ai-evaluation` — evaluation harness catalogue
- `/provider/analytics` — organisation analytics with privacy notice
- `/research` — research governance hub

## Reuse

Phase 14 builds on:

- `lib/analytics/admin-analytics-service.ts` — legacy summary metrics
- `lib/privacy-preserving-analytics/` — differential privacy placeholder runs
- `lib/federated-research/` — federated agreement governance
- `app/admin/privacy-analytics`, `app/admin/federated-research` — existing admin surfaces

## Tests

- `tests/analytics/` — config and metric registry
- `tests/privacy/analytics/` — de-identification and export approval
- `tests/research/` — research governance and withdrawal
- `tests/ai-evaluation/` — evaluation harness scenarios
