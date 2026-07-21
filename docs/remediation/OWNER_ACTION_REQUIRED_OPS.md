# Account-owner operations checklist

**Rule:** Do not mark items `VERIFIED` unless the named owner performed them and recorded evidence (run ID, screenshot, ticket, or signed note). Agents must leave unfinished work as `OWNER_ACTION_REQUIRED` or `NOT_RUN`.

**Inspected main tip at extract time:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`

## Branch protection and review

| Item                                                                                                   | Status                  | Evidence / next step                                                   |
| ------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------- |
| Enforce branch protection on `main` (PR required, no direct push)                                      | `OWNER_ACTION_REQUIRED` | GitHub Settings → Branches; agent token cannot assert protection rules |
| Required independent human approval (not author, not bot-only)                                         | `OWNER_ACTION_REQUIRED` | Require ≥1 approving review from CODEOWNERS / security                 |
| Status checks required (CI, Security, Migrations, Migrate from zero, Accessibility, Production claims) | `OWNER_ACTION_REQUIRED` | Align required checks with workflow names on `main`                    |

## Geoscape train (depth reduction — no fifth PR)

| Item                                                | Status                  | Notes                                |
| --------------------------------------------------- | ----------------------- | ------------------------------------ |
| Licensing/privacy approval for Geoscape (#367)      | `OWNER_ACTION_REQUIRED` | Do **not** merge #367 until recorded |
| After #367 merges: retarget/rebase #384 onto `main` | `NOT_RUN`               | Then keep #385 → #386 as depth ≤3    |
| Open a fifth Geoscape PR                            | `NOT_APPLICABLE`        | Forbidden                            |

Exact human commands (inspect / retarget only):

```bash
gh pr view 367 --json baseRefName,headRefName,isDraft,statusCheckRollup
gh pr edit 384 --base main   # only after #367 is on main
gh pr view 385 --json baseRefName
gh pr view 386 --json baseRefName
```

## Stale product PRs

| PR                | Stance                                                  | Status                |
| ----------------- | ------------------------------------------------------- | --------------------- |
| #379 PBS          | Blocked; recreate later under `lib/pbs-operations/**`   | `BLOCKED`             |
| #383 VisionAccess | Keep draft until explicit feature-freeze waiver         | `BLOCKED`             |
| #371/#372 a11y    | Superseded by focused accessibility-remediation extract | `retain_as_reference` |

## Neon staging migration rehearsal

| Item                                                   | Status                  |
| ------------------------------------------------------ | ----------------------- |
| Create Neon staging clone from production              | `OWNER_ACTION_REQUIRED` |
| Snapshot / enable PITR before rehearsal                | `OWNER_ACTION_REQUIRED` |
| Run production migration reconciliation on clone       | `OWNER_ACTION_REQUIRED` |
| Record `_prisma_migrations` diff vs expected inventory | `OWNER_ACTION_REQUIRED` |
| Do **not** mutate production Neon from agent role      | `VERIFIED` (policy)     |

## Secrets, keys, canonical URLs

| Item                                                             | Status                  |
| ---------------------------------------------------------------- | ----------------------- |
| Verify production secrets present and rotated on schedule        | `OWNER_ACTION_REQUIRED` |
| Verify encryption keys (app + field-level) match runbooks        | `OWNER_ACTION_REQUIRED` |
| Verify canonical public URLs / `NEXT_PUBLIC_APP_URL` / Auth URLs | `OWNER_ACTION_REQUIRED` — post-#387 production build failed: `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` rejected as non-https (`dpl_GgwzvxTy6LHDjcC2A8oRu6rKZEr4`) |

## Monitoring, alerts, rate limiting

| Item                                                         | Status                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Configure monitoring + paging alerts                         | `OWNER_ACTION_REQUIRED`                                                          |
| Assign on-call ownership                                     | `OWNER_ACTION_REQUIRED`                                                          |
| Configure distributed rate limiting (not process-local only) | `OWNER_ACTION_REQUIRED` — see `docs/operations/RATE_LIMITING.md` when #388 lands |

## Backup restore + incident tabletop

| Item                                                      | Status                  |
| --------------------------------------------------------- | ----------------------- |
| Perform backup restoration drill; record RTO/RPO observed | `OWNER_ACTION_REQUIRED` |
| Incident-response tabletop with named roles               | `OWNER_ACTION_REQUIRED` |

## Manual assistive technology matrix

| Item                           | Status    |
| ------------------------------ | --------- |
| NVDA                           | `NOT_RUN` |
| VoiceOver (macOS/iOS)          | `NOT_RUN` |
| TalkBack                       | `NOT_RUN` |
| Keyboard-only                  | `NOT_RUN` |
| Zoom 200% / 400%               | `NOT_RUN` |
| High contrast / forced colours | `NOT_RUN` |
| Reduced motion                 | `NOT_RUN` |

Track detail in `docs/qa/public-ui-accessibility-remediation.md`.

## Controlled-pilot golden journeys

| Item                                                    | Status    |
| ------------------------------------------------------- | --------- |
| Run every controlled-pilot golden journey with evidence | `NOT_RUN` |

Do not claim controlled-pilot readiness ≥75 until journeys and the above gates are evidenced.
