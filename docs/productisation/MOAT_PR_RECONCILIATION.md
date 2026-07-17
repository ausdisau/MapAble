# Moat series — PR and branch reconciliation

**Baseline main:** `fb80bc83` (pre-moat).  
**Active stacked product PRs (max 3):**

| # | Branch | Prompt | Status |
|---|--------|--------|--------|
| 328 | `cursor/participant-access-receipts-a2fa` | Trust Fabric — Access Receipts | Open draft |
| 329 | `cursor/access-evidence-envelope-a2fa` | Living Access Evidence — envelopes + change review | Open draft |
| (this) | `cursor/starting-work-db-journey-a2fa` | Whole-Journey — Starting Work DB projection | Open draft |

Do **not** open a fourth stacked product PR until one of the above merges or closes.

## Extract-only (do not merge wholesale)

| Open PR | Topic | Action |
|---------|--------|--------|
| #280 | RightsOS giant | **Superseded for Prompt 1** by #328 slice — do not merge #280 unchanged |
| #308 | AI reliability + VisionAccess | Extract later; #329 covers evidence persistence only |
| #309 | AccessOps civic twin | Extract Harbour venue status later (Prompt 7) |
| #301 | Continuity life events | Extract recovery kernel later (Prompt 5); no CareOSMission DDL |
| #319 | Replay Lab | Rebase later (Prompt 12) |
| #298 / #281 | Federation / vault | Deferred (vault-before-rights) |
| #299 / #267 / #277 | AURA stacks | Superseded pattern; Companion Stop AURA already on main |
| #307 / #311 / #294 | Accountability / governance / QSC | Extract appeals later (Prompt 11) |

## Close or supersede-label (human ops)

Recommend closing or labelling **superseded** (do not merge):

- #273, #265 — legacy Access Intelligence expansion (AI Next on main)
- #283 — parallel Transport MVP vs `TransportTrip`
- #287, #288 — already closed Continuity duplicates
- AccessCast duplicates #320–#322, #325 — already closed
- #323 RC1 — already closed

## CareOSMission rule

`Case` remains interim on main. `StartingWorkJourneyProjection` is a **temporary** cross-domain projection. Do not land CareOSMission DDL from AURA/Continuity tips until an explicit SoR PR after rebase.

## Stacking rule

```text
<= 3 unmerged product PRs
flags default off
no giant historical branch merges
public claims remain synthetic / internal_alpha / none
```
