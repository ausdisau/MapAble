# Understanding layer (CSNN)

Biological analogue: **Prefrontal Cortex** — synthesise raw inputs into contextual insights under legislative constraints.

## What this repo implements

Flag-gated Understanding kernel under [`lib/understanding/`](../../lib/understanding/):

| Piece | Role |
|---|---|
| AI Gateway capability `understanding.contextual` | Model resolution via `resolveModelForCapability` |
| Prompt `understanding.dda_ndis_context` | DDA duties + NDIS funding-rule constraints (no eligibility advice) |
| Knowledge Graph | Projects `ParticipationGoal`, support routines, `CalendarEvent`, contexts, informal supports |
| Informal supports | Capacity + stability trends for family/carer network |
| Living-arrangement signal | Heuristic **review** signal only — never SDA/SIL determination |
| `RelationshipRiskEvaluator` | Pluggable risk interface (default heuristic; future GNN can implement) |

Master flag: **`MAPABLE_UNDERSTANDING_ENABLED`** (default **off**).

## APIs

All require session; actor/participant id is taken from the session (never from the body). JSON bodies use `parseJsonRequestBody` (256KB + Content-Length).

| Route | Methods |
|---|---|
| `/api/understanding/chat` | POST |
| `/api/understanding/graph` | GET, POST |
| `/api/understanding/informal-supports` | GET, POST |
| `/api/understanding/living-arrangement-signal` | GET, POST |

## Transactional safety

- Multi-table Understanding writes use `runInTransaction` (`prisma.$transaction`).
- Graph edges have a unique natural key to prevent duplicate concurrent links.
- `SupportProfile` publish/draft accept optional `expectedVersion` for compare-and-swap.
- Trust ledger snapshot supersede+create is transactional.

## Explicitly not claimed

- Real GNN training/inference
- SDA/SIL eligibility determination
- Public WCAG / data-sovereignty marketing claims
- Indy mobile rewrite (this is a server capability + API)

See also [RECOGNISE.md](./RECOGNISE.md) for CSNN phase mapping.
