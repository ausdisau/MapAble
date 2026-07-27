# AURA Recognise layer (CSNN)

Biological analogue: **Amygdala** — hazard detection before Act.

## What this repo implements now

Extensible Recognise kernel inside [`lib/aura-harness/recognise/`](../../lib/aura-harness/recognise/):

| Criterion | Dimension id | Meaning |
|---|---|---|
| Capability-Dependence | `capability_dependence` | Task exceeds safe AI judgment |
| Irreversibility | `irreversibility` | Harm cannot be undone |
| Cascading Impact | `cascading_impact` | One change triggers chain reactions |

Scores fold into the existing gamma / concentration matrix (same fail-closed HITL policy). Optional **accreditation bridge** maps venue/place total scores (AS 1428 / MapAble tiers) into `accessibility_representation` when payload fields are present.

Plug-in API for future Act / Memory waves:

```ts
registerRiskCriterionEvaluator({
  id: "act.billing_cascade",
  evaluate: async ({ toolName, payload }) => ({ cascadingImpact: 85 }),
});
```

## CSNN mapping

| Phase | Status on main |
|---|---|
| Awareness | Product agents + transport/GTFS stacks (existing) |
| Understanding | AI-platform gateway / copilots (partial) |
| **Recognise** | **This harness kernel** |
| Act | Deferred A2H / billing automation (not this PR) |
| Memory / Pocket / Guardian | Deferred `lib/aura/` Agent OS |

## Flags

Recognise rides `MAPABLE_AURA_HARNESS_ENABLED` (default off). See [AURA_HARNESS.md](./AURA_HARNESS.md).
