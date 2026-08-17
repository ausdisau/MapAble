# Mission Evidence Graph and Semantic Retrieval

Read-only semantic layer over Starting Work canonical relationships. Not a second mission SoT.

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_MISSION_GRAPH_ENABLED` | false |
| `MAPABLE_SEMANTIC_RETRIEVAL_ENABLED` | false |
| `MAPABLE_EMBEDDINGS_ENABLED` | false |

## Rules

- Authoritative edges come from Starting Work dependency graph adapters
- Model-generated candidate edges require human review (`kind: candidate`)
- Security and consent filters run **before** ranking
- Embeddings optional; delete-on-revoke required before any live store
- No graph-generated operational writes
- Scope: `mission.starting_work` only

## Modules

- `lib/ai/platform/graph/`
- `lib/ai/platform/retrieval/`
- `lib/ai/platform/embeddings/types.ts` (contracts only)
