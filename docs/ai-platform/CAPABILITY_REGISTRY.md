# Capability registry

Every AI or AI-labelled capability registers via `lib/ai/platform/capabilities/seed.ts`.

Required fields include maturity, production claim status, feature flag, backend (deterministic | model_backed | hybrid), model identifier, prompt version, tool allowlist, data classes, authority ceiling, human-review and participant-approval requirements, budgets, evaluation suite, algorithm-register reference, kill-switch key.

A feature must not be publicly described as model-backed AI unless a real model is invoked.
