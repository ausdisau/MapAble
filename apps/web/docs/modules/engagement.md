# Engagement platform

Participants and carers engagement for continuous improvement, aligned with NDIS Practice Standards Core Module 1.5 (Feedback and complaints management).

## Routes

| Audience | Path | Purpose |
|----------|------|---------|
| Participant | `/dashboard/engagement` | Hub — rights panel, submissions, improvement visibility |
| Participant | `/dashboard/engagement/new` | Stepped intake (safety triage → feedback vs complaint) |
| Participant | `/dashboard/engagement/[id]` | Submission detail, timeline, Commission escalation |
| Admin | `/admin/engagement` | Triage queue, acknowledgement, CI actions |
| Admin | `/admin/engagement/analytics` | Platform NPS/CSAT benchmarks |
| Provider | `/provider/engagement` | Compliance hub metrics |
| Provider | `/provider/engagement/complaints` | Complaints register + CSV export |
| Provider | `/provider/engagement/improvements` | CI register |
| Provider | `/provider/engagement/training` | Worker complaints-handling LMS |
| Provider | `/provider/engagement/analytics` | Org-scoped NPS/CSAT vs platform median |

## Configuration

- `ENGAGEMENT_PLATFORM_ENABLED` — default on (`!== "false"`)
- `ENGAGEMENT_PROVIDER_INSIGHTS_ENABLED` — opt-in org analytics
- `ENGAGEMENT_NPS_MIN_COHORT` — small-N suppression threshold (default 5)
- `ENGAGEMENT_ACK_BUSINESS_DAYS` — complaint acknowledgement SLA (default 2)

## Data model

- `EngagementSubmission` — unified intake (feedback, complaints, CSAT)
- `EngagementSubmissionEvent` — procedural fairness timeline
- `EngagementImprovementAction` — participant-visible CI closure
- `EngagementNpsResponse` — NPS programme
- `WorkerTrainingModule` / `WorkerTrainingCompletion` — NDIS 1.5(4) evidence

## Delegate access (carers / family members)

Consent scopes:

- `engagement.read_delegate`
- `engagement.submit_delegate`

Delegates see an "Acting for [participant]" banner on the engagement hub.

## NDIS Practice Standards mapping

| Indicator | Platform capability |
|-----------|---------------------|
| 1.5(1) Complaints system | Formal complaint intake → `Complaint` + trust-safety queue; acknowledgement SLA fields |
| 1.5(2) Participant rights | Rights panel on hub; external Commission path; advocate flag |
| 1.5(3) Continuous improvement | `EngagementImprovementAction` with bidirectional complaint ↔ CI linkage |
| 1.5(4) Worker training | Provider training module + quiz completion records |
| QMS feedback loop | Provider registers, admin triage, post-service CSAT |

## Legal guardrails

- MapAble **facilitates** provider complaints processes; does not claim registered-provider status.
- Commission lodging requires **explicit user consent** — assisted handoff only.
- Immediate safety: **000** and Safety centre routing.

## APIs

- `GET/POST /api/engagement/submissions`
- `GET /api/engagement/submissions/[id]`
- `POST /api/engagement/complaints`
- `GET /api/engagement/improvements`
- `POST /api/engagement/nps`
- `POST /api/engagement/commission-lodge`
- `GET/PATCH /api/admin/engagement/submissions`
- `GET/POST/PATCH /api/admin/engagement/improvements`
- `GET /api/admin/engagement/analytics`
- `GET /api/provider/engagement/*`
