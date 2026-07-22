# Health endpoint diagnosis (controlled-pilot decision programme)

**Date:** 2026-07-21  
**Apex probe:** `https://mapable.com.au/api/health/live` and `/api/health/ready`

## Diagnosis

| Question                       | Finding                                                                                                         | Status                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Do routes exist in repository? | Yes — `app/api/health/live/route.ts`, `app/api/health/ready/route.ts` on `origin/main` @ `7009e9de` and on #388 | `VERIFIED`                                     |
| Different paths?               | No alternate public health paths required for pilot                                                             | `NOT_APPLICABLE`                               |
| Absent from repo?              | No                                                                                                              | `NOT_APPLICABLE`                               |
| Hidden by middleware matcher?  | Matcher includes API routes; no health exclusion found                                                          | `VERIFIED` (code review)                       |
| Apex HTTP result               | Both paths return **404 HTML** (Next document) as of probe                                                      | `FAILED` (edge)                                |
| Likely cause                   | Production deployment age / edge not serving current main routes — **not** missing source                       | `OWNER_ACTION_REQUIRED` to redeploy + re-probe |

## Required behaviour (repository)

| Endpoint                | Behaviour                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health/live`  | `{ "status": "ok" }`, `Cache-Control: no-store`, no version/host/env/secrets                                                     |
| `GET /api/health/ready` | DB check with 2500ms timeout; 200 `{ "status": "ready" }` or 503 `{ "status": "unavailable" }`; no connection strings/SQL/stacks |

Unit coverage: `tests/api/health-probes.test.ts` (live/ready success, failure, timeout, redaction, GET-only exports).

## Owner gate

Do **not** mark apex verification `VERIFIED` until Production redeploy evidence records 200/503 JSON (not 404 HTML) for both paths. Checklist: [OWNER_ACTION_REQUIRED_OPS.md](./OWNER_ACTION_REQUIRED_OPS.md).
