# Cross-module orchestration (Phase 3)

## Services
- `lib/orchestration/care-transport-orchestrator.ts` — linked transport draft from care request
- `lib/orchestration/jobs-support-orchestrator.ts` — interview transport calendar placeholder
- `lib/orchestration/invoice-orchestrator.ts` — invoice lines from approved care shift

## API
`POST /api/orchestration/care-transport/from-care-request`
`POST /api/orchestration/jobs/create-interview-support-draft`
`POST /api/orchestration/invoices/from-care-shift`

## Idempotency
`OrchestrationEvent.idempotencyKey` prevents duplicate side effects.

## Phase 4
Workflow engine, smart contracts, attestation.
