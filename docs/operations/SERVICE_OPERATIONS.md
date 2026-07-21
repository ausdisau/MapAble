# Service operations runbook

**Last refreshed:** 2026-07-20  
**Monitoring configuration:** `OWNER_ACTION_REQUIRED` until account owner confirms live uptime/alerting

## Ownership

| Role                        | Responsibility                      | Status                                     |
| --------------------------- | ----------------------------------- | ------------------------------------------ |
| On-call primary             | Acknowledge SEV-1/2                 | `OWNER_ACTION_REQUIRED` — name person/rota |
| Deploy authority            | Promote/rollback Vercel production  | `OWNER_ACTION_REQUIRED`                    |
| Participant support contact | Human support path for pilot        | `OWNER_ACTION_REQUIRED`                    |
| Rollback authority          | Decide app rollback vs flag disable | Programme lead + on-call                   |

## Uptime monitoring

Probes (non-sensitive):

| Probe     | Path                    | Expect                                                              |
| --------- | ----------------------- | ------------------------------------------------------------------- |
| Liveness  | `GET /api/health/live`  | 200 `{ "status": "ok" }`, `Cache-Control: no-store`                 |
| Readiness | `GET /api/health/ready` | 200 ready / 503 unavailable — no credentials/hostnames/stack traces |

If external uptime monitoring is not configured, status remains `OWNER_ACTION_REQUIRED`. Do not invent a vendor during freeze.

## SLO / alert matrix (targets)

Every alert row requires: threshold, window, severity, owner, escalation, participant impact, runbook, degraded mode.  
**Configuration evidence:** `OWNER_ACTION_REQUIRED` until the account owner records live monitor IDs.

| Signal                       | Threshold                                             | Window               | Severity | Owner    | Escalation                    | Participant impact                     | Runbook                                  | Degraded mode                               | Status                  |
| ---------------------------- | ----------------------------------------------------- | -------------------- | -------- | -------- | ----------------------------- | -------------------------------------- | ---------------------------------------- | ------------------------------------------- | ----------------------- |
| Health live probe            | non-200                                               | 5m                   | SEV-1    | On-call  | Page primary → programme lead | Site unreachable                       | This file + `production-preflight.md`    | Status page; no new pilot enables           | `OWNER_ACTION_REQUIRED` |
| Health ready / DB            | 503 ready                                             | 2m (ex. maintenance) | SEV-1    | On-call  | Page primary → DBA            | Auth/writes may fail                   | `BACKUP_RESTORE.md`                      | Read-only messaging; flags stay off         | `OWNER_ACTION_REQUIRED` |
| Auth error rate              | >3× baseline or >5% of auth traffic                   | 10m                  | SEV-2    | On-call  | Auth specialist               | Login blocked                          | `oauth-sign-in.md`                       | Keep sessions; pause marketing login pushes | `OWNER_ACTION_REQUIRED` |
| API 5xx rate                 | >2%                                                   | 10m                  | SEV-2    | On-call  | Eng primary                   | Partial outage                         | Vercel runtime logs                      | Disable non-essential flags                 | `OWNER_ACTION_REQUIRED` |
| Latency p95 HTML/API         | budget TBD by owner                                   | 15m                  | SEV-3    | On-call  | Eng                           | Slowness                               | Perf notes; CSP matrix is synthetic only | Cache/static paths; no enforce experiments  | `NOT_RUN`               |
| Background job failures      | ≥3 identical failures                                 | 30m                  | SEV-2    | On-call  | Eng                           | Delayed notifications/jobs             | Job logs; AT Continuity sends none       | Pause job runners                           | `OWNER_ACTION_REQUIRED` |
| CSP violations (report sink) | spike vs baseline                                     | 15m                  | SEV-3    | Security | Security eng                  | Possible script break if enforce later | `CSP_ENFORCEMENT.md`                     | Keep production report-only                 | `OWNER_ACTION_REQUIRED` |
| Security events              | any break-glass / secret scan / auth bypass suspicion | immediate            | SEV-1    | Security | Programme lead + privacy      | Trust compromise                       | `INCIDENT_RESPONSE.md`                   | Freeze deploys                              | `OWNER_ACTION_REQUIRED` |
| Notification failures        | provider error spike                                  | 15m                  | SEV-2    | On-call  | Messaging owner               | Missed human-approved notices          | Provider status                          | Fail closed; no auto-retry storms           | `OWNER_ACTION_REQUIRED` |

## Dependency status

Document status pages for Neon, Vercel, Stripe (if enabled), email/SMS providers. Sensitive capabilities must remain disabled if distributed rate limiting / required secrets are absent.

## Maintenance windows

Announce to pilot cohort; readiness may return 503 during planned DB maintenance — do not page solely on readiness in announced windows.

## Degraded-mode behaviour

- Flags stay fail-closed.
- Mock transport routing must not claim live availability.
- Essential non-AI flows remain preferred when AI/chat is unavailable.

## Rate limiting honesty

`lib/api/ip-rate-limit.ts` is **in-memory** and is **not** production-safe distributed limiting. Do not describe it as multi-instance safe. If no distributed store is configured, keep sensitive production capabilities disabled and leave the evidence ledger blocker in place.
