# Post-merge sequence — after #388 is human-merged (do not run now)

Agents must **not** execute merges, retargets, or mark-ready. Humans only.

## After #388 merges to `main`

```bash
# 1. Update local main
git fetch origin main
git checkout main
git pull origin main
git rev-parse HEAD   # record SHA

# 2. Rebase #389 onto main
git checkout cursor/accessibility-remediation-panel-42fc
git fetch origin
git rebase origin/main
# Resolve overlaps if any:
#   - app/layout.tsx: keep CSP resolveScriptNonce + panel/AccessiBe mutex + nonce on panel script
#   - OWNER_ACTION / GEOSCAPE docs: prefer post-#388 charter-linked packs when conflict
#   - ACCESSIBILITY_WIDGET_DECISION: keep #389 privacy pack
git push --force-with-lease origin cursor/accessibility-remediation-panel-42fc

# 3. Rerun full CI on #389 tip + four-way Preview matrix (owner):
#    A flags off | B CSP on | C panel on | D CSP+panel
#    Leave Production flags false.

# 4. Accessibility + privacy review (human) — NOT_RUN until recorded

# 5. Merge #389 only after independent approval (human)

# 6. Update/rebase #382
git fetch origin main
git checkout cursor/ndis-expansion-wave1-at-continuity-0a20
git rebase origin/main
git push --force-with-lease origin cursor/ndis-expansion-wave1-at-continuity-0a20

# 7. Rerun migration, AT Continuity unit, full CI on #382

# 8. Keep MAPABLE_AT_CONTINUITY_ENABLED=false until staging recon + human walkthrough VERIFIED
```

## Rollback

- Revert merge commits on `main` via GitHub revert PR if needed
- Unset Preview flags; Production CSP remains report-only
- AT Continuity stays disabled
