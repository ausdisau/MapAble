# PR Action Ledger — Productisation Wave 0

Source of structured actions: [`lib/convergence-os/seed/pr-action-ledger.ts`](../../lib/convergence-os/seed/pr-action-ledger.ts).

**Inspected main tip (ledger refresh):** `0e61eb04` (includes AccessCast #324).  
**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.  
**Stack policy:** No unmerged stack may grow beyond **3** PRs (`MAX_UNMERGED_STACK_DEPTH`).

## Actions vocabulary

`merge` · `rebase` · `recreate` · `split` · `consolidate` · `supersede` · `close` · `archive` · `defer` · `retain_as_reference` · `retire_after_migration`

## Already on main (retain_as_reference — do not re-merge)

| PR | Notes |
| --- | --- |
| #300 | Remediation CI / CODEOWNERS |
| #302 | ConvergenceOS twin + constitution |
| #303/#304/#306 | Access Intelligence Next synthetic foundation |
| #295 | Billing Centre / BillingInvoice |
| #297 | Transport Prompt 0–1 shell |
| #274 | Indoor accessibility |
| #324 | AccessCast synthetic outlook + Starting Work contracts |

## Immediate close targets (`SUPERSEDED_CLOSE_TARGETS`)

| PR | Reason | Superseded by |
| --- | --- | --- |
| #289 | Convergence predecessor | #302 (merged) |
| #290 | Convergence Iteration 2 predecessor | #302 (merged) |
| #291 | VisionAccess standalone | #308 |
| #264 | Legacy Access Intelligence | #273 + AI Next |
| #287 | Continuity predecessor | #301 |
| #288 | Continuity predecessor | #301 |
| #320 | AccessCast duplicate stack | #324 (merged) |
| #321 | AccessCast Starting Work duplicate | #324 |
| #322 | AccessCast Companion offline duplicate | #324 |
| #325 | AccessCast tip duplicate | #324 |
| #202 | Supabase Auth migration | NextAuth ownership |

## Immediate productisation train (depth ≤ 3)

| Order | PR | Action | Notes |
| --- | --- | --- | --- |
| 1 | #312 | **merge** | Wave 0 registries (this PR) |
| 2 | #313 | **rebase** → merge | Security / encryption / tenant |
| 3 | #314 | **rebase** → merge | Communication Passport → readiness |

Then **split** #315/#316/#317 onto main (do not keep 6-deep stack).

## Do not merge unchanged

| PRs | Action |
| --- | --- |
| #323 RC1 | **split** — never merge mega release branch |
| #315 → #316 → #317 | **split** onto main after #314 |
| #296 → #298 → #299 | **split** / **defer** |
| #301, #309 | **consolidate** |
| #231–#255 CareOS | **archive** / **defer** — no second Care writer |
| #266 | **supersede** via consolidate #273 |
| #283 | **retire_after_migration** onto TransportTrip |

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions. Run `pnpm exec tsx scripts/ci/check-merge-train-integrity.ts`.
