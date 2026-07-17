# PR Action Ledger — Leadership train

Source of structured actions: [`lib/convergence-os/seed/pr-action-ledger.ts`](../../lib/convergence-os/seed/pr-action-ledger.ts).

**Inspected main tip (ledger refresh):** `fb80bc83` (includes productisation #327).  
**Full reconciliation:** [LEADERSHIP_TRAIN_RECONCILIATION.md](./LEADERSHIP_TRAIN_RECONCILIATION.md)  
**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.  
**Stack policy:** No unmerged stack may grow beyond **3** PRs (`MAX_UNMERGED_STACK_DEPTH`).

## Actions vocabulary

`merge` · `rebase` · `recreate` · `split` · `consolidate` · `supersede` · `close` · `archive` · `defer` · `retain_as_reference` · `retire_after_migration`

## Already on main (retain_as_reference — do not re-merge)

| PR             | Notes                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| #300           | Remediation CI / CODEOWNERS                                              |
| #302           | ConvergenceOS twin + constitution                                        |
| #303/#304/#306 | Access Intelligence Next synthetic foundation                            |
| #295           | Billing Centre / BillingInvoice                                          |
| #297           | Transport Prompt 0–1 shell                                               |
| #274           | Indoor accessibility                                                     |
| #324           | AccessCast synthetic outlook + Starting Work contracts                   |
| #312/#313/#314 | Wave 0 registries, security, Communication–Workforce                     |
| #327           | Care/Transport/Billing, Companion, Provider Ops, synthetic Starting Work |

## Immediate close targets (`SUPERSEDED_CLOSE_TARGETS`)

| PR   | Reason                                   | Superseded by / next            |
| ---- | ---------------------------------------- | ------------------------------- |
| #289 | Convergence predecessor                  | #302 (merged)                   |
| #290 | Convergence Iteration 2 predecessor      | #302 (merged)                   |
| #291 | VisionAccess standalone                  | extract later / #308            |
| #264 | Legacy Access Intelligence               | AI Next on main                 |
| #287 | Continuity predecessor                   | extract from #301 later         |
| #288 | Continuity predecessor                   | extract from #301 later         |
| #320 | AccessCast duplicate stack               | #324 (merged)                   |
| #321 | AccessCast Starting Work duplicate       | #324                            |
| #322 | AccessCast Companion offline duplicate   | #324                            |
| #325 | AccessCast tip duplicate                 | #324                            |
| #202 | Supabase Auth migration                  | NextAuth ownership              |
| #332 | Transport quotes MIG collision with #328 | recreate `…150000` after #330   |
| #333 | Recurring Care MIG collision with #329   | recreate `…160000` after quotes |
| #334 | Starting Work duplicate of #330          | #330                            |
| #335 | Premature Continuity tip / stack >3      | Prompt 3 after Care/Transport   |

## Immediate leadership train (depth ≤ 3)

| Order | PR   | Action             | Notes                                             |
| ----- | ---- | ------------------ | ------------------------------------------------- |
| 1     | #331 | **merge**          | Strategy / operating lanes — no product migration |
| 2     | #328 | **rebase** → merge | Trust Fabric; keep `20260717120000`               |
| 3     | #329 | **rebase** → merge | Access Evidence; keep `20260717130000`            |

Then **rebase** #330 onto main (Starting Work DB). Recreate Transport quotes / Recurring Care with unique migrations only after #330.

## Do not merge unchanged

| PRs                          | Action                                          |
| ---------------------------- | ----------------------------------------------- |
| #301, #309                   | **defer** — extract-only mega-branches          |
| #319                         | **defer** — Replay Lab after domain slices      |
| #280, #273, #265, #308, #283 | **supersede** / extract later                   |
| #292–#299, #311, #318        | **defer** NDIS/AURA/governance megas            |
| #231–#255 CareOS             | **archive** / **defer** — no second Care writer |

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions. Run `pnpm exec tsx scripts/ci/check-merge-train-integrity.ts`.
