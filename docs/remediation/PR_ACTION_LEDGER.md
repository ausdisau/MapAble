# PR Action Ledger — Leadership train

Source of structured actions: [`lib/convergence-os/seed/pr-action-ledger.ts`](../../lib/convergence-os/seed/pr-action-ledger.ts).

**Inspected main tip (ledger refresh):** post-#329 Trust Fabric + Access Evidence.  
**Full reconciliation:** [LEADERSHIP_TRAIN_RECONCILIATION.md](./LEADERSHIP_TRAIN_RECONCILIATION.md)  
**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.  
**Stack policy:** No unmerged stack may grow beyond **3** PRs (`MAX_UNMERGED_STACK_DEPTH`).

## Actions vocabulary

`merge` · `rebase` · `recreate` · `split` · `consolidate` · `supersede` · `close` · `archive` · `defer` · `retain_as_reference` · `retire_after_migration`

## Immediate leadership train (depth ≤ 3)

| Order | PR   | Action    | Notes                                                  |
| ----- | ---- | --------- | ------------------------------------------------------ |
| 1     | #330 | **merge** | Starting Work DB — `20260717140000`                    |
| 2     | #341 | **merge** | Transport quotes recreate — `20260717150000`           |
| 3     | #340 | **merge** | Recurring Care recreate — `20260717160000` (base #341) |

## Closed colliding tips

#332, #333, #334, #335 — recreated as #341 / #340.

## Extract-only / deferred

#301 Continuity · #309 AccessOps · #319 Replay Lab · (RightsOS #280 closed; Transport MVP #283 closed; AI expansion #265/#273 closed)

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions. Run `pnpm exec tsx scripts/ci/check-merge-train-integrity.ts`.
