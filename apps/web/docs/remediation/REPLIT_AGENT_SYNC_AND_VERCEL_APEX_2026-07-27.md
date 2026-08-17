# Replit-agent sync + Vercel apex update (2026-07-27)

## Replit branch sync

`replit-agent` and `cursor-main` were **1 commit behind** `main` (no merge conflicts).

| Branch         | Before                         | After                           |
| -------------- | ------------------------------ | ------------------------------- |
| `main`         | `5b9c9118` (#427 AURA harness) | `5b9c9118`                      |
| `replit-agent` | `8f16d7d0` (Vite config fix)   | **fast-forwarded → `5b9c9118`** |
| `cursor-main`  | `8f16d7d0`                     | **fast-forwarded → `5b9c9118`** |

Commands used (fast-forward only):

```bash
git push origin origin/main:replit-agent
git push origin origin/main:cursor-main
```

PR #446 (Cursor ↔ Replit branch bridge) was already **MERGED**.

## Vercel / mapable.com.au

| Check                    | Result                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Production tip deploy    | `dpl_6oMgBPw6wUG1fqk2fzpP6atPeC3q` — **READY** (SHA `5b9c9118`)                                    |
| Apex cookie / routing    | `_vcrr_…=dpl_6oMgBPw6…`                                                                            |
| JSON-LD                  | `https://mapable.com.au` (no localhost)                                                            |
| `/api/health/live`       | **200** `{"status":"ok"}`                                                                          |
| `/api/health/ready`      | **503** `{"status":"unavailable"}` — DB readiness still failing (Neon/pool wake or `DATABASE_URL`) |
| `pnpm audit:https-gate`  | `VERIFIED_PUBLIC_EDGE_ONLY`                                                                        |
| `www.mapable.com.au` TLS | Still **expired** (owner renew)                                                                    |

Agent cannot add/move custom domains via MCP (no domain write tool; no `VERCEL_TOKEN` in this environment). Apex is already served by project `mapableau-new` (`prj_iAhQk0b6IhigXw58PFiYfiHSATmW`).

## Remaining owner actions

1. Confirm Production env `DATABASE_URL` / `DIRECT_URL` for Neon production until `/api/health/ready` returns **200**.
2. Renew `www.mapable.com.au` TLS (or remove+re-add domain in Vercel).
3. Stale open PRs with `mergeable=CONFLICTING` are unrelated long-lived feature branches — rebase separately as needed.
