# AccessCast Offline Visit Pack Contract

## Purpose

Companion may save an AccessCast snapshot for offline use. The snapshot must never be silently presented as the current operational outlook.

## Required fields

| Field | Meaning |
| --- | --- |
| `generatedAt` | When the forecast was computed |
| `expiresAt` | After this instant, effective state becomes `stale` |
| `savedAt` | When the device stored the pack |
| `sourcesNotRefreshed` | Canonical feeds not updated while offline |
| `offlineClaim` | Always `saved_snapshot_only` |
| `changedSinceSaved` | True when expired or unre refreshed sources remain |

## Storage

- Use Companion encrypted local store (see open tip #315 patterns).
- Contract: `lib/accesscast/offline-store-contract.ts`
- Key prefix: `mapable.accesscast.offline.v1`
- Lock-screen label: `Access outlook saved` (no journey/home detail)

## Evaluation API

`POST /api/accesscast/offline/evaluate` (flags off → 404) returns pack metadata + evaluation + presentation copy with `showAsCurrent: false`.
