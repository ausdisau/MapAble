# Leadership train reconciliation (Prompt 0)

**Inspected main tip (initial):** `fb80bc83ad7cbd80f8f8b3ced01ef62372081d7b`  
**Reconciliation completed (UTC):** `2026-07-17`  
**Repository:** `ausdisau/mapableau-new`

## Landed

| PR   | Role                                  | Migration        |
| ---- | ------------------------------------- | ---------------- |
| #336 | CI type-check / lint + ledger refresh | none             |
| #331 | Strategy / operating lanes            | none             |
| #328 | Trust Fabric access receipts          | `20260717120000` |
| #329 | Access Evidence Envelope              | `20260717130000` |

## Active train (≤ 3)

| Order | PR   | Branch                                              | Migration        |
| ----- | ---- | --------------------------------------------------- | ---------------- |
| 1     | #330 | `cursor/starting-work-db-journey-a2fa`              | `20260717140000` |
| 2     | #341 | `cursor/transport-persistent-quotes-b3d4`           | `20260717150000` |
| 3     | #340 | `cursor/care-recurring-agreements-b3d4` (base #341) | `20260717160000` |

## Closed colliding / overflow tips

#332, #333, #334, #335 — recreated as #341 / #340.

## Extract-only mega-branches

| PR                       | Status                                             |
| ------------------------ | -------------------------------------------------- |
| #301 Continuity          | Open — extract-only comment; never merge wholesale |
| #309 AccessOps           | Open — extract-only comment                        |
| #319 Replay Lab          | Open — deferred to Prompt 13                       |
| #280 RightsOS            | Closed — superseded by #328                        |
| #283 Transport MVP       | Closed — retire onto TransportTrip                 |
| #265 / #273 AI expansion | Closed — AI Next + #329 path                       |

## Decision

**STOP** opening additional product PRs until one of #330 / #341 / #340 merges.  
**GO** for landing #330 next, then #341, then #340.

NEXT SAFE CURSOR PROMPT: Prompt 1 is already embodied by #341 (persistent Transport quotes); merge #330 first, then land #341/#340 before opening Prompt 3 Continuity recovery.
