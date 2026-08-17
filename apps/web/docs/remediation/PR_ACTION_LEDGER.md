# PR Action Ledger — Remediation control (2026-07-20)

Source of structured actions: [`lib/platform/convergence-os/seed/pr-action-ledger.ts`](../../lib/platform/convergence-os/seed/pr-action-ledger.ts).

**Inspected main tip:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1` (pre-#387 merge)  
**Full Phase 0 rescan:** [RESCAN_RECONCILIATION.md](./RESCAN_RECONCILIATION.md)  
**Axios scope:** [AXIOS_GHSA_GCFJ_64VW_6MP9.md](./AXIOS_GHSA_GCFJ_64VW_6MP9.md)  
**#387 review:** [INDEPENDENT_REVIEW_387.md](./INDEPENDENT_REVIEW_387.md)  
**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.  
**Stack policy:** No unmerged stack may grow beyond **3** PRs (`MAX_UNMERGED_STACK_DEPTH`).

## Actions vocabulary

`merge` · `rebase` · `recreate` · `split` · `consolidate` · `supersede` · `close` · `archive` · `defer` · `retain_as_reference` · `retire_after_migration`

## Immediate control train (independent from `main`, depth 1)

Prefer independent branches from current `main`. Do **not** add a fifth PR on the Geoscape train.

| Order | PR                         | Action                                       | Notes                                          |
| ----- | -------------------------- | -------------------------------------------- | ---------------------------------------------- |
| 1     | **#387** truth/controls    | **`merge`** (authorised this session)        | Docs + readiness CI + axios override; CI green |
| 2     | **#388** runtime hardening | `rebase` onto post-#387 `main` then validate | CSP preview gate; no prod enforce              |
| 3     | **#382** AT Continuity     | `rebase`/`repair` on tip; leave draft        | Ownership + build-memory; human preview        |

### Geoscape train reduction (licensing/privacy gated)

| Step | Action                                   | Gate                                                                               |
| ---- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| A    | Merge **#367**                           | **Only after** licensing/privacy approval (`OWNER_ACTION_REQUIRED` until recorded) |
| B    | Retarget/rebase **#384** onto `main`     | After #367 merges                                                                  |
| C    | Keep **#385 → #386** as depth ≤3 on #384 | Do **not** open a fifth PR                                                         |

### Stale product PRs

| PR                   | Action                                                        |
| -------------------- | ------------------------------------------------------------- |
| #379 PBS             | **Blocked** — recreate later under `lib/pbs-operations/**`    |
| #383 VisionAccess    | Keep **draft** until explicit feature-freeze waiver           |
| #371/#372 a11y panel | Extract first-party panel into focused PR from current `main` |

## Geoscape stack (policy breach — depth 4)

```text
#367 (main) → #384 → #385 → #386
depth: 1       2      3      4  ← exceeds MAX=3
```

| PR   | Action                                                 | Notes                                                      |
| ---- | ------------------------------------------------------ | ---------------------------------------------------------- |
| #367 | `merge` only after independent review                  | Base of train; CI green; flags default false               |
| #384 | `defer` until depth ≤3                                 | Depends on #367                                            |
| #385 | `defer` / consider `consolidate` with #384             | Depends on #384                                            |
| #386 | **`consolidate` or `split`** — must not remain depth 4 | Human retarget after merges; **do not** open another child |

### Recommended human cleanup (agent will not execute)

After each human merge, retarget dependents in GitHub UI:

1. Merge #367 into `main` (when ready) **or** squash #367+#384 into one PR from `main`.
2. Retarget #385 base to `main` (or to the consolidated tip) — Settings → base branch.
3. Retarget #386 only when stack depth would be ≤3.
4. Alternative: close #385/#386 and recreate as ≤2 independent PRs from fresh `main`.

Exact CLI (human only):

```bash
# Inspect only — do not merge from agent role
gh pr view 367 --json baseRefName,headRefName,isDraft,statusCheckRollup
gh pr view 384 --json baseRefName,headRefName
gh pr view 385 --json baseRefName,headRefName
gh pr view 386 --json baseRefName,headRefName
# Retarget example (human):
# gh pr edit 385 --base main
```

## PBS / VisionAccess / programmes

| PR                | Designation                             | Action                                                                                                                                                  |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #379 PBS          | **Blocked / extractable future Wave 7** | Canonical owner path is `lib/pbs-operations/**`. Do not merge #379’s `lib/positive-behaviour-support/**` as Wave 7 SoT. Human: close or recreate later. |
| #383 VisionAccess | Freeze review                           | Independent from `main`; CI green; keep flags false; do not stack under Geoscape                                                                        |
| #380 / #381       | MERGED                                  | Wave 0 docs + migrate-from-zero repair                                                                                                                  |

## Closed / merged leadership slots (historical)

#330, #341, #340 — **MERGED** (no longer open merge targets).

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions. Run `pnpm exec tsx scripts/ci/check-merge-train-integrity.ts` and `pnpm ci:readiness-evidence`.
