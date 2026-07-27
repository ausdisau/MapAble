# Moat series — PR and branch reconciliation

**Baseline main tip (post-#329):** see `origin/main`.  
**Stack policy:** max **3** unmerged product PRs.

## Landed

| #    | Topic                                    | Status                    |
| ---- | ---------------------------------------- | ------------------------- |
| #331 | Strategy / operating lanes               | Merged                    |
| #328 | Trust Fabric — Access Receipts           | Merged (`20260717120000`) |
| #329 | Access Evidence Envelope + Change Review | Merged (`20260717130000`) |

## Active / queued

| #          | Branch                                    | Prompt                      | Status                             |
| ---------- | ----------------------------------------- | --------------------------- | ---------------------------------- |
| #330       | `cursor/starting-work-db-journey-a2fa`    | Starting Work DB projection | Queued / rebase onto main          |
| (recreate) | `cursor/transport-persistent-quotes-b3d4` | Persistent Transport quotes | After #330; MIG `20260717150000`   |
| (recreate) | `cursor/care-recurring-agreements-b3d4`   | Recurring Care              | After quotes; MIG `20260717160000` |

Closed colliding Opportunity tips: **#332**, **#333**, **#334**, **#335** (do not merge).

## Extract-only (do not merge wholesale)

| Open PR            | Topic                             | Action                                              |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| #280               | RightsOS giant                    | Superseded for Trust Fabric by #328                 |
| #308               | AI reliability + VisionAccess     | Extract later; #329 covers evidence persistence     |
| #309               | AccessOps civic twin              | Extract Harbour venue status later                  |
| #301               | Continuity life events            | Extract recovery kernel later; no CareOSMission DDL |
| #319               | Replay Lab                        | Rebase later after domain slices                    |
| #298 / #281        | Federation / vault                | Deferred                                            |
| #299 / #267 / #277 | AURA stacks                       | Extract-only                                        |
| #307 / #311 / #294 | Accountability / governance / QSC | Extract appeals later                               |

## Autonomy Assurance (Prompt 0)

Docs-only reconciliation + freeze waiver **W-AA-1**:
[`docs/ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](../ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md).

- Extends Trust Fabric (#328) and in-process AURA harness — **not** a wholesale merge of #299 / #311.
- Product Train A/B/C each ≤ 3 unmerged PRs; do not attach to breached Geoscape stack.
- Verdict: narrow freeze waiver required (main tip matched pack baseline `dd5ff9fc`).

## CareOSMission rule

`Case` remains interim on main. `StartingWorkJourneyProjection` is a **temporary** cross-domain projection. Do not land CareOSMission DDL from AURA/Continuity tips until an explicit SoR PR after rebase.

## Stacking rule

```text
<= 3 unmerged product PRs
flags default off
no giant historical branch merges
public claims remain synthetic / internal_alpha / none
```
