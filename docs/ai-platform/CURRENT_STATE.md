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

## Stacked programme branches (this delivery)

AI matching truth → ai-platform foundation → mission portfolio → ai-evals → mission copilot → case copilot → billing evidence copilot.

## Still deferred (follow-on checkpoint)

AURA Agent OS mega-branches, VisionAccess multimodal, Quality & Safeguards Copilot, Continuity Copilot, Companion on-device AI.

## Claim honesty

All ConvergenceOS public claims remain `publicClaimAllowed: false`. `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` defaults false.
