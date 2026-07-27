# CareOS AI governance

## Default posture

Fail-closed. AI and CareOS modules are off unless explicitly enabled per environment.

| Flag | Production expectation |
|------|------------------------|
| `MAPABLE_AI_ENABLED` | `false` until governance sign-off |
| `MAPABLE_CAREOS_ENABLED` | `false` until mission SoR validated |
| `MAPABLE_CAREOS_MODEL_REASONING_ENABLED` | `false` in production initially |
| `MAPABLE_CAREOS_WRITE_ACTIONS` | `false` — no autonomous writes |

Align fabric defaults with tip fail-closed (`intelligence/config.ts` audit finding).

## Autonomy levels

| Level | Allowed in production |
|-------|----------------------|
| L0 Information | Yes |
| L1 Drafts | Yes (human review before use) |
| L2 Recommendations | Yes (ceiling) |
| L3 Confirmed action | No (future increment) |
| L4 Routine mandate | Disabled |

## Model use

- When `OPENAI_API_KEY` absent or reasoning disabled, deterministic paths retain the same approval controls (`docs/mapable-intelligence-fabric.md`).
- Prompts and raw model outputs are not stored in participant-visible audit without redaction.
- AI monitoring surfaces: `/admin/ai-governance`, `/admin/ai-monitoring`

## Evaluation

- Synthetic mainframe isolated behind `MAPABLE_CORE_INTELLIGENCE_MAINFRAME_ENABLED`
- Evaluation harness: `tests/ai-evaluation/`, `tests/intelligence/evaluation-harness.test.ts`
- Journey tests assert AI-disabled paths remain safe (`tests/careos/journeys/**`)

## Prohibited uses

See `docs/careos/PROHIBITED_USES.md` and registry enforcement in `lib/intelligence/careos/policy/prohibited-uses.ts`.

## Change control

Algorithm register (`/admin/algorithm-register`) records material model or policy changes. Production enablement requires safety case update and human approval.
