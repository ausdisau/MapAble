# AI Evidence Intake Studio

Review-first document and media intake. AI proposes document classes and field candidates; humans or participants review; canonical writes stay disabled until an explicit later wave.

## Authority

- Ceiling: `DRAFT_ONLY`
- No live OCR in Wave 1 (synthetic fixtures only)
- `MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED` must remain `false` for this wave
- Instructions found inside retrieved document text must not be executed

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_AI_INTAKE_ENABLED` | false |
| `MAPABLE_AI_INTAKE_MODEL_ENABLED` | false |
| `MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED` | false |

## Contracts

- `IntakeDocument` — tenant, participant scope, hash, storage ref (existing Document / lib/storage)
- `ExtractionRun` — provider/parser metadata; no raw participant content in telemetry
- `ExtractionCandidate` — field, value, page, confidence vocabulary, correction
- `IntakeReview` — accept / correct / reject / unresolved
- `IntakeProvenanceReceipt` — provenance, unknowns, conflicts, write refusal

## Accessibility

Text-first review, keyboard navigation, page/source references, plain-language field explanations. No bounding-box dependency.

## Module

`lib/ai-platform/intake/`
