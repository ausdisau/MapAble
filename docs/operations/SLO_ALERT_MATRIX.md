# SLO / alert matrix

**Status:** targets proposed; monitoring configuration `OWNER_ACTION_REQUIRED`  
**Do not invent a new observability vendor during feature freeze.**

| Signal                     | Target                   | Alert when                                      | Status                  |
| -------------------------- | ------------------------ | ----------------------------------------------- | ----------------------- |
| Public availability (apex) | 99.0% pilot              | Probe fail ≥5m                                  | `OWNER_ACTION_REQUIRED` |
| Authentication failures    | Baseline + anomaly       | Sudden surge without deploy                     | `OWNER_ACTION_REQUIRED` |
| Database readiness         | ready except maintenance | `/api/health/ready` 503 ≥2m                     | `OWNER_ACTION_REQUIRED` |
| Request latency (p95)      | Track initially          | p95 over budget ≥15m                            | `NOT_RUN`               |
| Job failures               | Track                    | Repeated same-job failure                       | `OWNER_ACTION_REQUIRED` |
| Email / messaging failures | Track                    | Provider error spike                            | `OWNER_ACTION_REQUIRED` |
| Critical security events   | Zero tolerance           | Break-glass, secret scan, auth bypass suspicion | `OWNER_ACTION_REQUIRED` |

Probes: `GET /api/health/live` (liveness) and `GET /api/health/ready` (DB readiness). Responses must remain free of credentials, hostnames, stack traces, and schema data (`Cache-Control: no-store`). Correlation ids may appear on responses via middleware (`x-correlation-id`).
