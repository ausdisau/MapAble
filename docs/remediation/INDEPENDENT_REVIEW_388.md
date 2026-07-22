# Independent review checklist — PR #388 (prepared; not submitted)

**PR:** #388 `cursor/production-readiness-runtime-hardening-42fc`  
**Purpose:** Human security/runtime review pack.  
**Rule:** CodeRabbit SUCCESS and green CI are **not** independent human approval.  
**Status:** checklist prepared — review itself `NOT_RUN` until a named independent reviewer signs.

## Reviewer metadata (`NOT_RUN` until filled)

| Field                          | Value                                 |
| ------------------------------ | ------------------------------------- |
| Reviewer name                  |                                       |
| Independence (not implementer) |                                       |
| Date                           |                                       |
| Tip SHA reviewed               |                                       |
| Preview URL (if any)           |                                       |
| Outcome                        | APPROVE / REQUEST CHANGES / `NOT_RUN` |

## Checklist

| Item                             | Expected                                                                                       | Result | Evidence |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------ | -------- |
| Production CSP posture           | Report-only only; no enforce header on Production                                              |        |          |
| Production enforce impossibility | `VERCEL_ENV=production` hard-off even if flag true                                             |        |          |
| Nonce handling                   | Per-request nonce; request + response CSP; `x-nonce` internal                                  |        |          |
| Enforce policy shape             | No `unsafe-eval`; `object-src 'none'`; `frame-ancestors 'none'`; report-uri present            |        |          |
| Report collection / redaction    | Content-type allowlist; size bounds; no script samples; URI redaction; no cookies/auth logging |        |          |
| Health endpoint exposure         | Live/ready minimal JSON; no secrets/topology; `Cache-Control: no-store`                        |        |          |
| Flag defaults                    | `MAPABLE_CSP_ENFORCE_PREVIEW` default off; high-risk flags false                               |        |          |
| Rollback                         | Unset Preview flag; Production never had enforce                                               |        |          |
| Combined #388+#389               | Ephemeral local results reviewed; dual Preview still `NOT_RUN`                                 |        |          |
| Remaining owner-only evidence    | HTTPS env, apex health deploy, Preview flag-on, branch protection                              |        |          |

## Repository automation (not a substitute for this review)

| Gate                                          | Tip evidence                                              |
| --------------------------------------------- | --------------------------------------------------------- |
| CI / CSP enforce preview / Security / Semgrep | Re-check current tip — historically SUCCESS on `6b70fbd5` |
| Independent human approval                    | `NOT_RUN`                                                 |

## Sign-off

| Field           | Value     |
| --------------- | --------- |
| Signature / ack |           |
| Blocking issues |           |
| Status          | `NOT_RUN` |
