# Edge AI Capability Broker

Local-first processing broker for Companion and equivalent web pathways.

## Processing ladder

1. Deterministic local function  
2. On-device model (flagged)  
3. Privacy-disclosed cloud model (flagged)  
4. Human assistance  

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_EDGE_AI_ENABLED` | false |
| `MAPABLE_ON_DEVICE_AI_ENABLED` | false |
| `MAPABLE_CLOUD_AI_FALLBACK_ENABLED` | false |

## Guarantees

- Every result includes a `ProcessingReceipt`
- Essential Visit Pack access does not require an AI-capable device
- `publicAppStoreClaim` is always `false` in this wave
- Web / deterministic / human pathways remain available

## Initial deterministic capabilities

- Offline Visit Pack summary
- Local What Changed explanation

Model-backed edge capabilities (plain language, AAC, translation, etc.) route to abstain/human until later waves enable them with governance.
