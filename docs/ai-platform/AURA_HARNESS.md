# AURA Agentic Risk Harness (product-agent MVP)

In-process risk interceptor for MapAble `ToolLoopAgent` product agents (disability services + booking services). Implements the AURA gamma / concentration model with fail-closed Human-in-the-Loop (HITL) on High–High risk.

This is **not** the deferred `lib/aura/` Agent OS stack. Programme proposal boundaries remain in [`lib/programmes/aura/execution-gate.ts`](../../lib/programmes/aura/execution-gate.ts).

## Flag

| Env | Default | Purpose |
|---|---|---|
| `MAPABLE_AURA_HARNESS_ENABLED` | `false` | Master switch; when off, tool wrapping is a no-op |
| `MAPABLE_AURA_HARNESS_MAX_GAMMA` | `75` | High γ threshold (0–100 weighted average) |
| `MAPABLE_AURA_HARNESS_MAX_CONCENTRATION` | `150` | High C_conc threshold |
| `MAPABLE_AURA_HARNESS_MEMORY_TTL_DAYS` | `60` | Fingerprint precedent TTL |

## Math

Scores `s` are on `[0, 100]`. Weights `w` come from MapAble defaults (privacy / medical elevated).

- `U_tot = Σ w`
- `γ_action = Σ (s × w)`
- `γ_norm = γ_action / U_tot` (weighted average on 0–100)
- `σ²_γ = (1/U_tot) Σ w (s − s̄_w)²`
- `C_conc = 200 × √(σ²_γ)`

## Escalation matrix

| γ | C_conc | Action |
|---|---|---|
| Low | Low | Approve + log |
| Low | High | `MASK_PII` then `REDUCE_SCOPE`; re-score; if still hot → **fail-closed HITL** |
| High | Low | **Deny** |
| High | High | **Fail-closed HITL** (do not execute) |

Fail-closed tool results keep the AI SDK loop stable:

```json
{ "aura": { "blocked": true, "pendingHumanReview": true, "reason": "...", "profile": { } } }
```

## Recognise criteria (pluggable)

Dimensions `capability_dependence`, `irreversibility`, and `cascading_impact` are scored by default evaluators in [`lib/aura-harness/recognise/`](../../lib/aura-harness/recognise/) and folded into γ / C_conc. Register additional evaluators with `registerRiskCriterionEvaluator` for future Act/Memory waves. Acute irreversibility or cascading impact escalates APPROVE/MITIGATE to fail-closed HITL (does not override systemic DENY).

Optional accreditation bridge: payload fields `accreditationTotalScore` / `venueAccessibilityScore` / `placeAccessibilityScore` map MapAble tiers into accessibility risk. See [RECOGNISE.md](./RECOGNISE.md).

## Integration

- Core: [`lib/aura-harness/`](../../lib/aura-harness/)
- Wrapped in [`lib/agent/disability-services-agent.ts`](../../lib/agent/disability-services-agent.ts) and [`lib/agent/booking-services-agent.ts`](../../lib/agent/booking-services-agent.ts)
- Session summary → `createAgentRun` risk tier / `humanReviewRequired` / `guardrailsTriggered` (includes `recognise` audit)
- Memory: Prisma `AuraHarnessMemory` fingerprint table (no live embeddings)
- Mitigations reuse [`redactSensitiveText`](../../lib/ai-platform/redaction/sensitive.ts) and [`deidentifyRecord`](../../lib/data-governance/deidentification-service.ts)
- Kill switches: `assertModelCallAllowed` when AI platform foundation is enabled

## Out of scope (this MVP)

- MCP proxy / SSE transport / Docker sidecar
- Evaluator LLM judge
- Live vector embeddings
- Granting autonomous write authority
- Deferred `lib/aura/` Agent OS (Pocket / Guardian / Memory cards)
