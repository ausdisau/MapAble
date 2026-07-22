# Geoscape train — reduce to depth ≤3 (no fifth PR)

**Policy:** `MAX_UNMERGED_STACK_DEPTH = 3`  
**Current train:** `#367 → #384 → #385 → #386` (depth 4 — programme debt)  
**Agent rule:** Do not open a fifth PR. Do not auto-merge or auto-retarget.

## Human sequence (exact)

1. Record **licensing/privacy approval** for Geoscape (`OWNER_ACTION_REQUIRED` until done).
2. Independently review **#367**.
3. Merge **#367** into `main` (human merge only).
4. Update local main: `git fetch origin main && git checkout main && git pull origin main`.
5. Retarget / rebase **#384** onto `main` (human):

```bash
gh pr edit 384 --base main
# or rebase the #384 branch onto origin/main and force-with-lease push if history requires it
```

6. Rerun all required checks on #384.
7. Keep `#385 → #386` stacked so unmerged depth ≤ 3.
8. **Do not open a fifth PR.**

## Related blocks

| PR                | Stance                                       | Status                              |
| ----------------- | -------------------------------------------- | ----------------------------------- |
| #367              | Blocked on licensing/privacy                 | `BLOCKED` / `OWNER_ACTION_REQUIRED` |
| #384              | Base = #367 head until retarget              | `BLOCKED` pending #367              |
| #379 PBS          | Recreate later under `lib/pbs-operations/**` | `BLOCKED`                           |
| #383 VisionAccess | Draft until recorded freeze waiver           | `BLOCKED`                           |

## Inspect only

```bash
gh pr view 367 --json number,baseRefName,headRefName,isDraft,mergeable
gh pr view 384 --json number,baseRefName,headRefName
gh pr view 385 --json number,baseRefName,headRefName
gh pr view 386 --json number,baseRefName,headRefName
```
