# MapAble AI Platform — Current State

Positioning: *An evidence-aware, participant-controlled copilot for complete disability-support journeys.*

## On main (foundation registry)

| Capability key | Backend | Maturity | Flag default |
|---|---|---|---|
| search.nl_interpreter | hybrid | production_supported | on when keys present |
| search.access_needs_interpreter | hybrid | production_supported | on with interpreter |
| provider_finder.reply_generator | model_backed | controlled_pilot | SEARCH_AGENT off |
| agent.disability_services | model_backed | experimental | off |
| agent.booking_services | model_backed | experimental | off |
| case.deterministic_engine | deterministic | deterministic | case AI on, autorun off |
| case.extractive_summary | deterministic | deterministic | case AI |
| billing.copilot | deterministic | deterministic | on |
| matching.care_rules | deterministic | deterministic | on |
| matching.ai_overlay | deterministic | experimental | AI_MATCHING off |
| accesscast.forecast | deterministic | synthetic_only | off |
| access_intelligence_next.preflight | deterministic | synthetic_only | off |
| mission.copilot | deterministic | controlled_pilot | MAPABLE_MISSION_COPILOT off |
| case.copilot | deterministic | controlled_pilot | MAPABLE_CASE_COPILOT off |
| billing.evidence_copilot | deterministic | controlled_pilot | MAPABLE_BILLING_EVIDENCE_COPILOT off |
| intake.document_classify | deterministic | synthetic_only | MAPABLE_AI_INTAKE off |
| intake.field_extract | deterministic | synthetic_only | MAPABLE_AI_INTAKE off |
| mission.evidence_graph | deterministic | controlled_pilot | MAPABLE_MISSION_GRAPH off |
| mission.semantic_retrieval | deterministic | controlled_pilot | MAPABLE_SEMANTIC_RETRIEVAL off |
| edge.visit_pack_summary | deterministic | controlled_pilot | MAPABLE_EDGE_AI off |
| edge.what_changed_explain | deterministic | controlled_pilot | MAPABLE_EDGE_AI off |
| agent.aura_harness | deterministic | experimental | MAPABLE_AURA_HARNESS off |
| agent.aura_recognise | deterministic | experimental | rides AURA harness flag |
| understanding.contextual | model_backed | experimental | MAPABLE_UNDERSTANDING off |
| navigator.provider_search.interpret | hybrid | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED off |
| navigator.provider_search.reply | model_backed | experimental | MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED off |
| navigator.provider_search.match | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED (+ MATCHING) off |
| navigator.provider_search.draft_service_request | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENVELOPES off |
| navigator.provider_search.escalate | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED off |

Navigator pilot surfaces (Decision Passport, governed memory, matching) also require
`MAPABLE_NAVIGATOR_PILOT_PASSPORT` / `_MEMORY` / `_MATCHING` (all default false).
See [NAVIGATOR_ASSURANCE.md](./NAVIGATOR_ASSURANCE.md).
## Advanced AI Expansion train (≤ 3)

1. Evidence Intake contracts (`lib/ai/platform/intake/`)
2. Mission Evidence Graph + hybrid retrieval
3. Companion Edge AI broker + ProcessingReceipt

See [ADVANCED_MERGE_TRAIN.md](./ADVANCED_MERGE_TRAIN.md) and [INTAKE.md](./INTAKE.md).

## Still deferred (follow-on checkpoint)

AURA Agent OS mega-branches (`lib/aura/`), VisionAccess multimodal, Quality & Safeguards Copilot, Continuity Copilot, live OCR, embeddings, computer-use.

The in-process **AURA Agentic Risk Harness** (`lib/aura-harness/`) is separate from deferred Agent OS — see [AURA_HARNESS.md](./AURA_HARNESS.md).

**Registry honesty gap (Prompt 0):** Previously `agent.aura_harness` / `agent.aura_recognise` appeared in this table but were absent from `seed.ts`. Phase 1 of the Navigator governed pilot registers those keys plus `navigator.provider_search.*`, with an ARC sidecar (classification only — no runtime authority). See [NAVIGATOR_GOVERNED_PILOT_PHASE_0.md](./NAVIGATOR_GOVERNED_PILOT_PHASE_0.md).

### CareGPT (design only)

| Capability key | Backend | Maturity | Flag default |
|---|---|---|---|
| care.gpt (planned) | hybrid | controlled_pilot | `MAPABLE_CARE_GPT_ENABLED` off — **not registered / not implemented** |

Participant-facing Care conversational surface at `/care/gpt` (planned). Orchestrates Care APIs, Co-Pilot drafts, and care agents; never silent book/assign/bill. Spec: [docs/modules/caregpt.md](../modules/caregpt.md).

## Claim honesty

All ConvergenceOS public claims remain `publicClaimAllowed: false`. `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` defaults false.
