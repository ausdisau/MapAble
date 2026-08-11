# Capability registry

Every AI or AI-labelled capability registers via `lib/ai/platform/capabilities/seed.ts`.

Required fields include maturity, production claim status, feature flag, backend (deterministic | model_backed | hybrid), model identifier, prompt version, tool allowlist, data classes, authority ceiling, human-review and participant-approval requirements, budgets, evaluation suite, algorithm-register reference, kill-switch key.

Optional additive fields: `version`, `requiredConsentScopes`, `approvalExpiryMinutes`.

Design-time ARC assessments live in `lib/ai/platform/capabilities/arc-sidecar.ts` and **must not** grant runtime authority.

A feature must not be publicly described as model-backed AI unless a real model is invoked.

Navigator pilot keys (`navigator.provider_search.*`) and AURA keys (`agent.aura_harness`, `agent.aura_recognise`) are registered with flags default **false**. Runtime enforcement for Navigator uses `lib/ai/navigator/gates.ts`.
