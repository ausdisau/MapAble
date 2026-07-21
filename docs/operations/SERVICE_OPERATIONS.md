# Service operations runbook

**Last refreshed:** 2026-07-20  
**Monitoring configuration:** `OWNER_ACTION_REQUIRED` until account owner confirms live uptime/alerting

## Ownership

| Role | Responsibility | Status |
| ---- | -------------- | ------ |
| On-call primary | Acknowledge SEV-1/2 | `OWNER_ACTION_REQUIRED` — name person/rota |
| Deploy authority | Promote/rollback Vercel production | `OWNER_ACTION_REQUIRED` |
| Participant support contact | Human support path for pilot | `OWNER_ACTION_REQUIRED` |
| Rollback authority | Decide app rollback vs flag disable | Programme lead + on-call |

## Uptime monitoring

Probes (non-sensitive):

| Probe | Path | Expect |
| ----- | ---- | ------ |
| Liveness | `GET /api/health/live` | 200 `{ "status": "ok" }`, `Cache-Control: no-store` |
| Readiness | `GET /api/health/ready` | 200 ready / 503 unavailable — no credentials/hostnames/stack traces |

If external uptime monitoring is not configured, status remains `OWNER_ACTION_REQUIRED`. Do not invent a vendor during freeze.

## SLO / alert matrix (targets)

| Signal | Target | Alert when | Status |
| ------ | ------ | ---------- | ------ |
| Public availability (apex) | 99.0% pilot | 5xx spike / probe fail 5m | `OWNER_ACTION_REQUIRED` |
| Authentication failures | Baseline + anomaly | Sudden surge without deploy | `OWNER_ACTION_REQUIRED` |
| Database readiness | ready except maintenance | ready=503 > 2m | `OWNER_ACTION_REQUIRED` |
| Request latency (p95 HTML/API) | Track only initially | p95 > budget 15m | `NOT_RUN` |
| Job failures | Track | Repeated failure same job | `OWNER_ACTION_REQUIRED` |
| Email/messaging failures | Track | Provider error rate spike | `OWNER_ACTION_REQUIRED` |
| Critical security events | Zero tolerance | Break-glass, secret scan fail, auth bypass suspicion | `OWNER_ACTION_REQUIRED` |

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
