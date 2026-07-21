# Geoscape train — reduce to depth ≤3 (no fifth PR)

**Policy:** `MAX_UNMERGED_STACK_DEPTH = 3`  
**Current breach:** `#367 → #384 → #385 → #386` (depth 4)

## Authorised sequence (human)

1. **Do not merge #367** until licensing/privacy approval is recorded (`OWNER_ACTION_REQUIRED`).
2. After approval, merge **#367** into `main` first.
3. Retarget / rebase **#384** onto `main` (not onto a side tip of #367 alone once merged).
4. Keep **#385 → #386** stacked on the #384 tip so the unmerged train is at most three deep.
5. **Do not open a fifth PR** on this train. If more work is needed, consolidate into #384/#385/#386 or wait for merges.

## Agent constraints

- Agents must not merge #367 without recorded licensing/privacy approval.
- Agents must not retarget foreign programme PRs unless the account owner explicitly asks in-session.
- Prefer documenting the human CLI over silent GitHub base edits.

## Inspect commands

```bash
gh pr view 367 --json number,baseRefName,headRefName,isDraft,mergeable
gh pr view 384 --json number,baseRefName,headRefName
gh pr view 385 --json number,baseRefName,headRefName
gh pr view 386 --json number,baseRefName,headRefName
```
