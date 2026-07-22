# Health endpoint diagnosis (public informational GO gate)

**Date:** 2026-07-22  
**Apex probe:** `https://mapable.com.au/api/health/live` and `/api/health/ready`  
**Repository tip inspected:** `2042a210edba065a500c2936c95f22e47497dec3` (and this remediation branch)

## Diagnosis

| Question                       | Finding                                                                                                                                                     | Status                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Do routes exist in repository? | Yes — `app/api/health/live/route.ts`, `app/api/health/ready/route.ts` on `origin/main` @ `2042a210`                                                         | `VERIFIED`               |
| Different paths?               | No alternate public health paths required for informational GO                                                                                              | `NOT_APPLICABLE`         |
| Absent from repo?              | No                                                                                                                                                          | `NOT_APPLICABLE`         |
| Hidden by middleware matcher?  | Matcher includes API routes; no health exclusion found                                                                                                      | `VERIFIED` (code review) |
| Apex HTTP result               | Both paths return **404 HTML** (Next document) as of 2026-07-22 probe while serving older deployment `dpl_MBD4G6ZZhRQ84iTqx2oc1sqZ3dVK`                     | `FAILED` (edge)          |
| Latest Production deploy       | `dpl_D6eih3NnqM4QJvYL3wRTkuiG2ycc` for SHA `2042a210` — **ERROR** (`pnpm run build` exit 1)                                                                 | `FAILED` (Vercel)        |
| Deploy failure root cause      | `assertDeployedProductionEnv`: `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` reject insecure HTTP on Production — **owner env**, not missing health route source | `OWNER_ACTION_REQUIRED`  |
| Deployment drift               | Live apex SHA/deployment ≠ latest Production attempt for current main                                                                                       | `VERIFIED` (drift)       |

## Mandatory dependency for readiness (informational site)

| Dependency                      | Required for `/api/health/ready` 200? | Notes                                                               |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Application process             | Yes (implicit)                        | Covered by `/api/health/live`                                       |
| Database (`prisma.$queryRaw`)   | **Yes** (current design)              | 2500ms timeout; 503 on failure — do **not** force unconditional 200 |
| Participant matching / bookings | No                                    | Not probed                                                          |
| Payments / claims               | No                                    | Not probed                                                          |

Static marketing HTML can render without DB, but the **ready** probe intentionally gates on DB because the deployed Next app still loads Prisma-backed routes and production env requires a production database URL. Separating “static informational only” readiness would be a larger architecture change and is out of scope unless done with tests and owner approval.

## Required behaviour (repository)

| Endpoint                | Behaviour                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health/live`  | `{ "status": "ok" }`, `Cache-Control: no-store`, no version/host/env/secrets                                                     |
| `GET /api/health/ready` | DB check with 2500ms timeout; 200 `{ "status": "ready" }` or 503 `{ "status": "unavailable" }`; no connection strings/SQL/stacks |

Unit coverage: `tests/api/health-probes.test.ts` (live/ready success, failure, timeout, redaction, GET-only exports).

## Owner gate

1. Set Production `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://mapable.com.au` (values must not be pasted into agent chat).
2. Redeploy Production from the approved remediation SHA.
3. Confirm deployed SHA matches the reviewed SHA.
4. Re-probe live/ready for JSON 200/503 (not 404 HTML).

Do **not** mark apex verification `VERIFIED` until those steps are evidenced. Checklist: [OWNER_ACTION_REQUIRED_OPS.md](./OWNER_ACTION_REQUIRED_OPS.md).
