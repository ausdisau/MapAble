# Leadership train reconciliation (Prompt 0)

**Inspected main tip:** `fb80bc83ad7cbd80f8f8b3ced01ef62372081d7b`  
**Inspection time (UTC):** `2026-07-17T19:18:01Z`  
**Repository:** `ausdisau/mapableau-new`

## Decision

**STOP** new product branches while Moat + Opportunity trains both remain open.  
**GO** only for CI hardening and landing the three allowable heads below.

## Next three allowable PRs

| Order | PR   | Branch                                             | Role                                      |
| ----- | ---- | -------------------------------------------------- | ----------------------------------------- |
| 1     | #331 | `cursor/strategic-opportunity-reconciliation-e909` | Strategy / operating lanes (no migration) |
| 2     | #328 | `cursor/participant-access-receipts-a2fa`          | Trust Fabric (`20260717120000`)           |
| 3     | #329 | `cursor/access-evidence-envelope-a2fa`             | Access Evidence (`20260717130000`)        |

**Queued:** #330 Starting Work DB (`20260717140000`) after a slot frees.

## Migration collisions (do not merge as-is)

| Timestamp        | Moat winner          | Colliding tip         | Action                                                |
| ---------------- | -------------------- | --------------------- | ----------------------------------------------------- |
| `20260717120000` | #328 Trust Fabric    | #332 Transport quotes | Close #332; recreate as `20260717150000` after #330   |
| `20260717130000` | #329 Access Evidence | #333 Recurring Care   | Close #333; recreate as `20260717160000` after quotes |

Also close Opportunity overflow **#334** (duplicates #330) and **#335** (premature Continuity; stack depth > 3).

## Extract-only mega-branches (never merge wholesale)

| PR                    | Topic                          | Later extract                      |
| --------------------- | ------------------------------ | ---------------------------------- |
| #301                  | Continuity life events         | Prompt 3 ContinuityCase recovery   |
| #309                  | AccessOps civic twin           | Harbour venue Access Ops pilot     |
| #280                  | RightsOS                       | Already sliced by #328             |
| #273 / #265 / #308    | AI expansion giants            | Evidence already in #329 path      |
| #283                  | Parallel Transport MVP         | Retire onto TransportTrip          |
| #319                  | Replay Lab                     | Prompt 13 after domain slices land |
| #292–#299, #311, #318 | NDIS / AURA / governance megas | Defer                              |

## Already on main (do not re-merge)

#312, #313, #314, #324, **#327** (Care/Transport/Billing, Companion, Provider Ops, synthetic Starting Work).

## Machine ledger

`lib/convergence-os/seed/pr-action-ledger.ts` — `PRODUCTISATION_TRAIN_HEADS = [331, 328, 329]`.
