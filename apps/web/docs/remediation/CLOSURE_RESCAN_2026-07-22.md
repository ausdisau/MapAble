# Public informational GO-gate — closure rescan

**Date:** 2026-07-22  
**Resolved `origin/main`:** `2042a210edba065a500c2936c95f22e47497dec3`  
**Note:** Prior `CLOSURE_RESCAN_2026-07-21.md` referenced pre-merge tip `3f406c37` and open #388/#389/#382. Those PRs are **merged**. This document supersedes stale merge-stack claims for the informational GO gate only.

## Current facts (repository vs production)

| Fact                                         | Evidence                                                                                 | Status                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| Main tip includes merged #388/#389/#382 path | GitHub `main` @ `2042a210`                                                               | `VERIFIED`              |
| Production CSP enforce hard-off              | Live apex `Content-Security-Policy-Report-Only` present; enforce off                     | `VERIFIED` (edge)       |
| High-risk flags default false                | Code: panel / AT Continuity / CSP enforce require `=== "true"`                           | `VERIFIED` (repository) |
| Security advisory GHSA-f88m-g3jw-g9cj        | `next` → `sharp@0.34.5` on main; patched via override in remediation PR                  | see remediation PR      |
| Health routes in repo                        | `app/api/health/{live,ready}`                                                            | `VERIFIED`              |
| Apex health JSON                             | 404 HTML on live edge                                                                    | `FAILED` (edge)         |
| Latest Production build for main             | `dpl_D6eih3Nn…` ERROR — HTTP URLs in Production env                                      | `OWNER_ACTION_REQUIRED` |
| Human a11y / keyboard smoke                  | [PUBLIC_INFORMATIONAL_HUMAN_A11Y_SCRIPT.md](./PUBLIC_INFORMATIONAL_HUMAN_A11Y_SCRIPT.md) | `NOT_RUN`               |
| Pilot / NDIS / claims readiness              | Out of informational scope                                                               | **NO-GO** (unchanged)   |

## Evidence classes (do not conflate)

| Class      | Meaning                                       |
| ---------- | --------------------------------------------- |
| Repository | Source + unit/CI on a SHA                     |
| Local      | Agent/developer machine build or probe        |
| CI         | GitHub Actions on a SHA                       |
| Preview    | Vercel Preview deployment                     |
| Production | Apex `mapable.com.au` / Production deployment |
| Human      | Named tester with artefact                    |

Local or CI green is **not** production GO evidence.
