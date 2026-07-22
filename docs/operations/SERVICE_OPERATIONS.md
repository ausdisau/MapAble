# Service operations runbook

**Canonical pilot boundary:** [CONTROLLED_PILOT_CHARTER.md](./CONTROLLED_PILOT_CHARTER.md)  
**Last refreshed:** 2026-07-21  
**Monitoring configuration:** `OWNER_ACTION_REQUIRED` until account owner confirms live uptime/alerting  
**Recommended targets (not achieved):** RTO 4h, RPO 1h, critical ack 15m / high ack 30m during staffed hours (Australia/Sydney)

## Ownership

Named roles live in the charter responsibility matrix (placeholders until filled).

| Role                           | Responsibility                     | Status                  |
| ------------------------------ | ---------------------------------- | ----------------------- |
| Technical incident owner       | SEV-1/2 ack during staffed hours   | `OWNER_ACTION_REQUIRED` |
| Pilot and release owner        | Pilot suspend / release decisions  | `OWNER_ACTION_REQUIRED` |
| Deploy authority               | Promote/rollback Vercel production | `OWNER_ACTION_REQUIRED` |
| Database/recovery operator     | PITR / staging restore             | `OWNER_ACTION_REQUIRED` |
| Privacy and safeguarding owner | Participant-impacting incidents    | `OWNER_ACTION_REQUIRED` |

## Uptime monitoring

| Probe     | Path                    | Expect                                                              | Apex status (2026-07-21)                              |
| --------- | ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Liveness  | `GET /api/health/live`  | 200 `{ "status": "ok" }`, `Cache-Control: no-store`                 | `FAILED` — 404 HTML; redeploy `OWNER_ACTION_REQUIRED` |
| Readiness | `GET /api/health/ready` | 200 ready / 503 unavailable — no credentials/hostnames/stack traces | `FAILED` — 404 HTML                                   |

Repository routes exist on main/#388 — see [../remediation/HEALTH_ENDPOINT_DIAGNOSIS.md](../remediation/HEALTH_ENDPOINT_DIAGNOSIS.md).

## Alert matrix (pilot-critical)

Every alert requires: threshold, window, severity, owner, deputy, notification channel, acknowledgement target, escalation, participant impact, runbook, safe degraded mode.  
**External configuration:** `OWNER_ACTION_REQUIRED` (no vendor invented here).

| Signal                        | Threshold                                       | Window               | Severity | Owner                    | Deputy               | Channel                 | Ack target  | Escalation                  | Participant impact            | Runbook                    | Degraded mode                        | Status                  |
| ----------------------------- | ----------------------------------------------- | -------------------- | -------- | ------------------------ | -------------------- | ----------------------- | ----------- | --------------------------- | ----------------------------- | -------------------------- | ------------------------------------ | ----------------------- |
| Apex availability (live)      | non-200                                         | 5m                   | SEV-1    | Technical incident owner | Pilot owner          | `OWNER_ACTION_REQUIRED` | 15m staffed | Page → privacy if prolonged | Site unreachable              | This file + preflight      | Status page; no new enables          | `OWNER_ACTION_REQUIRED` |
| Readiness failure             | 503 ready                                       | 2m (ex. maintenance) | SEV-1    | Technical incident owner | DB/recovery operator | `OWNER_ACTION_REQUIRED` | 15m staffed | Page → DBA                  | Auth/writes may fail          | `BACKUP_RESTORE.md`        | Read-only messaging; flags off       | `OWNER_ACTION_REQUIRED` |
| Authentication failures       | >3× baseline or >5%                             | 10m                  | SEV-2    | Technical incident owner | Auth specialist      | `OWNER_ACTION_REQUIRED` | 30m staffed | Auth specialist             | Login blocked                 | `oauth-sign-in.md`         | Pause marketing login pushes         | `OWNER_ACTION_REQUIRED` |
| API 5xx rate                  | >2%                                             | 10m                  | SEV-2    | Technical incident owner | Eng                  | `OWNER_ACTION_REQUIRED` | 30m staffed | Eng primary                 | Partial outage                | Vercel logs                | Disable non-essential flags          | `OWNER_ACTION_REQUIRED` |
| Latency p95                   | owner budget                                    | 15m                  | SEV-3    | Technical incident owner | Eng                  | `OWNER_ACTION_REQUIRED` | 30m staffed | Eng                         | Slowness                      | Synthetic CSP matrix ≠ RUM | Cache/static; no enforce experiments | `NOT_RUN`               |
| Database connectivity         | ready failures as above                         | 2m                   | SEV-1    | DB/recovery operator     | Technical incident   | `OWNER_ACTION_REQUIRED` | 15m staffed | Pilot owner                 | Data path down                | `BACKUP_RESTORE.md`        | Fail closed writes                   | `OWNER_ACTION_REQUIRED` |
| Background job failures       | ≥3 identical                                    | 30m                  | SEV-2    | Technical incident owner | Eng                  | `OWNER_ACTION_REQUIRED` | 30m staffed | Eng                         | Delayed jobs                  | Job logs                   | Pause runners                        | `OWNER_ACTION_REQUIRED` |
| Notification failures         | provider error spike                            | 15m                  | SEV-2    | Technical incident owner | Messaging            | `OWNER_ACTION_REQUIRED` | 30m staffed | Pilot owner                 | Missed human-approved notices | Provider status            | Fail closed; no retry storms         | `OWNER_ACTION_REQUIRED` |
| CSP reports                   | spike vs baseline                               | 15m                  | SEV-3    | Security                 | Technical incident   | `OWNER_ACTION_REQUIRED` | 30m staffed | Security eng                | Script break if enforce later | `CSP_ENFORCEMENT.md`       | Keep prod report-only                | `OWNER_ACTION_REQUIRED` |
| Security events               | break-glass / secret / auth bypass suspicion    | immediate            | SEV-1    | Security                 | Privacy owner        | `OWNER_ACTION_REQUIRED` | 15m staffed | Programme + privacy         | Trust compromise              | `INCIDENT_RESPONSE.md`     | Freeze deploys                       | `OWNER_ACTION_REQUIRED` |
| Participant isolation failure | any confirmed cross-tenant/participant exposure | immediate            | SEV-1    | Privacy/safeguarding     | Technical incident   | `OWNER_ACTION_REQUIRED` | 15m staffed | Pilot suspend               | Data exposure                 | Charter stop conditions    | Suspend pilot                        | `OWNER_ACTION_REQUIRED` |
| Consent enforcement failure   | bypass / revoke failure                         | immediate            | SEV-1    | Privacy/safeguarding     | Technical incident   | `OWNER_ACTION_REQUIRED` | 15m staffed | Pilot suspend               | Unlawful processing risk      | Consent runbooks + charter | Suspend affected workflows           | `OWNER_ACTION_REQUIRED` |

## Degraded-mode behaviour

- Flags stay fail-closed.
- Mock transport routing must not claim live availability.
- General public degradation: read-only or unavailable-safe mode.
- Provider selection remains human-only; communications human-approved only.

## Rate limiting honesty

`lib/api/ip-rate-limit.ts` is **in-memory** and is **not** production-safe distributed limiting. Sensitive pilot mutations remain `BLOCKED` until [RATE_LIMITING.md](./RATE_LIMITING.md) is satisfied.
