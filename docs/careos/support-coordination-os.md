# CareOS Phase 7 — Support Coordination OS

Operational support coordination for NDIS support coordinators. Reuses the existing `app/support-coordinator/` portal shell and `lib/support-coordinator/` relationship/consent infrastructure.

## Architecture

- **CoordinationCase** — SC practice management (not generic `Case` or `CareOSMission` caseload)
- **Optional link** — `linkedCaseId` connects to AI case management when relevant
- **Authority** — coordinators act only within `SupportCoordinatorRelationship` (active) or `hasParticipantAuthority` for domain `support_coordination`
- **Operational priority** — `low | medium | high | urgent` for triage only; no participant risk scoring
- **AI safety** — may draft/suggest; must NOT determine funding, R&N, capacity, or force provider choice

## Models

| Model | Purpose |
| --- | --- |
| `CoordinationCase` | Participant coordination file |
| `CoordinationTask` | Tasks with `waitingOn` indicators |
| `CoordinationCaseAssignment` | Multi-coordinator assignments |
| `CoordinationCaseNote` | Internal or participant-visible notes |
| `ParticipantContact` | Contact channels for a participant |
| `ProviderEnquiry` | Disclosure-preview provider outreach |
| `EvidenceRequest` | Evidence collection with provenance |
| `CoordinationMilestone` | Key dates |
| `CoordinationSupervisionRecord` | Supervision notes |
| `EvidencePack` | Compiled claims with source refs |

## Feature flags

```env
MAPABLE_SUPPORT_COORDINATION_ENABLED=false
MAPABLE_COORDINATION_ENQUIRIES_ENABLED=false
MAPABLE_COORDINATION_EVIDENCE_PACKS_ENABLED=false
MAPABLE_COORDINATION_SUPERVISION_ENABLED=false
```

Safety flags (always false in code):

- `fundingDecisionEnabled`
- `capacityDeterminationEnabled`
- `automaticProviderSelectionEnabled`

## API routes

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/coordinator/cases` | GET, POST | Caseload list and case creation |
| `/api/coordinator/enquiries` | GET, POST, PATCH | Provider enquiry lifecycle |
| `/api/coordinator/evidence` | GET, POST | Evidence requests and packs |

## UI

- `/support-coordinator/caseload` — caseload dashboard with task board and enquiry panel
- Components: `CaseloadDashboard`, `TaskBoard`, `EnquiryPanel`

## Migration

`prisma/migrations/20260714080000_support_coordination_os/migration.sql`

## Tests

```bash
pnpm vitest run tests/support-coordination tests/accessibility/coordinator
```
