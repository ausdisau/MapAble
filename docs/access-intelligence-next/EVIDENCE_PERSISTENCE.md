# Persistent Access Evidence Envelope and Human Change Review

**Mode:** shadow / synthetic (Harbour pilot)  
**Flags (default off):**
- `MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED`
- `MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED`
- `MAPABLE_ACCESS_CHANGE_DETECTION_ENABLED` (for change-detection route)

## Scope

- Durable `AccessEvidenceEnvelopeRecord` with provenance: feature, place (optional FK), source class, capture/effective/expiry times, precision, confidence basis, verification status, conflict state
- Feature-specific freshness policies (door width, lift status, temporary obstruction, etc.)
- Conflicting evidence preserved — never averaged into false confidence
- Durable `AccessChangeReviewRecord` with human decide path that **never** auto-publishes to `AccessPlace`
- Harbour Civic Centre controlled pilot subject refs (entrance, lift, room)

## Non-goals

- No second place source of truth
- No broad sensor ingestion
- No camera inference as truth
- No safety guarantee / auto-publication
- No VisionAccess production claims

## Canonical owners

| Concern | Owner |
|---------|--------|
| Place SoT | `AccessPlace` |
| Envelope writer | `lib/access-intelligence-next/evidence/persist.ts` |
| Change review writer | `lib/access-intelligence-next/change-detection/persist.ts` |
| Freshness policy | `lib/access-intelligence-next/evidence/freshness-policy.ts` |

## Public-claim state

`productionClaim: "none"`. Persisted ≠ verified ≠ accessible.

## APIs

- `GET|POST /api/access-intelligence-next/evidence`
- `GET|POST /api/access-intelligence-next/change-review`
- `POST /api/access-intelligence-next/change-detection` (persists when evidence persistence enabled)

## Rollback

Disable `MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED`. Existing rows remain for audit; routes return 404/503.
