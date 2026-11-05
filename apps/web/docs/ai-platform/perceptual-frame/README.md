# AURA × MAIRA — Care & Support Perceptual Frame (schema-only)

**Status:** internal draft, synthetic-only, not claimable.  
**Scope:** contracts, documentation and offline tests only. No model calls, routes, migrations, live feature flags, ingestion, external data or automated support actions.

## Included

- `schemas/care-support-perceptual-frame.schema.json`: full JSON Schema 2020-12 for a persisted frame (11 top-level sections, 16 definitions).
- `schemas/maira-care-support-output.schema.json`: separate, strict-compatible OpenAI Structured Outputs contract. Model may interpret and propose; it cannot grant consent or authority.
- `examples/*.synthetic.json`: one fictitious participant request and one corresponding proposed interpretation.
- `SOURCE_MAPPING.md`: honest statement that NDIA media/8038 is an XLSX source whose cells have **not** been independently mapped.
- `tests/verify-fixtures.mjs`: six Node.js structural and governance invariant tests.

Run from `apps/web`:

```bash
node --test docs/ai-platform/perceptual-frame/tests/verify-fixtures.mjs
```

The upstream detached v1.0.0 package also passed 16 offline Python JSON Schema and referential-integrity tests. Those results are **local evidence**, not GitHub CI or production assurance.

## Source-of-truth boundaries

- Keep participant identity, organisation membership, delegated authority and purpose checks in existing MapAble Core services.
- Do not introduce a second consent or authority store. Read existing consent receipts; check active scope before any retrieval/model request and again before consequential execution.
- Existing `lib/ai/platform/retrieval/hybrid.ts` has a Starting Work-only scope. **Do not** generalise its present filter to private participant retrieval without full record-level authorisation and robust null/tenant scoping tests.
- Proposed `ParticipantRAG` and `ProviderRAG` are future read-only adapters, **not** integrated by this PR. Public directory registration is not worker screening, current availability or individual competency.
- Never pass the persisted `subject`, `governance` or unrelated private evidence directly to a model. Send an authorised minimum-necessary evidence projection.
- MAIRA output contains hypotheses and draft options, not consent, diagnosis, medical/capacity judgments, NDIS funding determinations or execution permissions.
- AURA execution boundaries under `lib/programmes/aura/execution-gate.ts` remain authoritative. Approval for human review never means auto-execute.
- Preserve participant correction, AAC support, dignity of risk, non-AI path, data minimisation, revocation and audit.

## Freeze alignment

This change stays inside `docs/ai-platform/**` and the existing W-AA-1 AI Autonomy Assurance documentation/testing scope. It does not create new runtime agents, a top-level Agent OS, Prisma tables, routes, public claims, or extra registration/claim functions. `MAPABLE_AURA_HARNESS_ENABLED` remains unchanged and default OFF.

**No go-live** until current authority service and tenant/participant boundaries are verified, documented clinical and rights reviews are complete, retrieval revocation/invalidation works, privacy impact and cross-border handling are assessed, and WCAG 2.2 AA + AAC/switch/screen reader participation tests pass.

## Source caveat

`SOURCE_MAPPING.md` is deliberately not an NDIA data crosswalk. The user's separate browser-based NDIS pricing explorer contains illustrative catalogue and pricing values; it is not incorporated as a verified source of price limits, registration or individual funding eligibility.

## Relevant existing repository surfaces

- `lib/ai/platform/retrieval/types.ts`
- `lib/ai/platform/retrieval/hybrid.ts`
- `lib/ai/platform/embeddings/types.ts`
- `lib/bookings/rag/**`
- `lib/provider/finder/ask-bridge.ts`
- `lib/consent/consent-service.ts`
- `lib/programmes/aura/execution-gate.ts`
- `lib/aura-harness/**`

Official reference: https://developers.openai.com/api/docs/guides/structured-outputs
