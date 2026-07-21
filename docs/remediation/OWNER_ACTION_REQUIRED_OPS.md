# Account-owner release pack (controlled pilot)

**Canonical pilot boundary:** [../operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md)  
**Rule:** Do not mark items `VERIFIED` unless the named owner performed them and recorded evidence. A checklist is not evidence.  
**Inspected `origin/main`:** `7009e9de7c815267577404c324231c504077372e`  
**Agents must not** change Vercel, Neon, GitHub, DNS, monitoring, or payment accounts.

## Ordered release procedure

### A — Vercel Production configuration

Owner sets **without disclosing values in chat or logs**:

1. `NEXTAUTH_URL=https://mapable.com.au`
2. `NEXT_PUBLIC_APP_URL=https://mapable.com.au` (must match)
3. Redeploy Production
4. Record evidence form:

| Field                                                   | Value | Status                                                                                                                 |
| ------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Deployment ID                                           |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Commit SHA                                              |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Build result                                            |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Canonical redirect result                               |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Auth smoke (`/api/auth/session`, `/api/auth/providers`) |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Live endpoint (`/api/health/live`)                      |       | `OWNER_ACTION_REQUIRED` (apex currently 404 HTML — see [HEALTH_ENDPOINT_DIAGNOSIS.md](./HEALTH_ENDPOINT_DIAGNOSIS.md)) |
| Ready endpoint (`/api/health/ready`)                    |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Rollback result or rollback readiness                   |       | `OWNER_ACTION_REQUIRED`                                                                                                |

Read-only public probe (no secrets): `pnpm audit:https-gate`

### B — Vercel Preview assurance

Run **separate** Preview configurations and record pass/fail per matrix (all human/`NOT_RUN` until done):

| Config | Flags                                                  | Status    |
| ------ | ------------------------------------------------------ | --------- |
| B1     | All new flags **off**                                  | `NOT_RUN` |
| B2     | `MAPABLE_CSP_ENFORCE_PREVIEW=true` only                | `NOT_RUN` |
| B3     | `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true` only | `NOT_RUN` |
| B4     | CSP enforce + first-party panel both on                | `NOT_RUN` |

For each config verify: authentication, registration, provider finder, accessibility map, Care, Transport, hydration, nonce (B2/B4), CSP violations, AccessiBe absent when panel on (B3/B4), panel persist/reset, performance, console/network errors, rollback by unsetting flags.

Production CSP enforce remains **hard-off**. Panel and AT Continuity flags remain **false** in Production until separate recorded decisions.

### C — GitHub governance

Configure and screenshot-verify:

| Control                                                                                                                                              | Status                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| PR required; ≥1 independent approval; dismiss stale approvals                                                                                        | `OWNER_ACTION_REQUIRED` |
| Required checks: CI, Migrations, Migrate from zero, Security, Accessibility, Production claims, domain ownership, readiness evidence, Vercel Preview | `OWNER_ACTION_REQUIRED` |
| No silent administrator bypass; documented break-glass                                                                                               | `OWNER_ACTION_REQUIRED` |

Helpers: `pnpm audit:branch-protection`; [../operations/branch-protection.md](../operations/branch-protection.md)

### D — Database and recovery

Provide Neon **staging clone** (not production credentials to agents). Complete:

| Step                                                               | Status                                          |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| Migration inventory/checksum comparison (read-only helper on #382) | `OWNER_ACTION_REQUIRED`                         |
| Empty-database migrate-from-zero (CI already proves disposable DB) | CI `VERIFIED`; staging clone `NOT_RUN`          |
| Staging migration rehearsal                                        | `NOT_RUN`                                       |
| Snapshot / PITR                                                    | `NOT_RUN`                                       |
| Restore + schema verification + app smoke                          | `NOT_RUN`                                       |
| Measured RTO (target 4h) / RPO (target 1h)                         | `NOT_RUN` — targets not achieved until measured |
| Rollback decision recorded                                         | `OWNER_ACTION_REQUIRED`                         |

Never use Prisma push against shared/production DBs. Never alter production `_prisma_migrations` history from agent role.

### E — Distributed rate limiting

| Finding                             | Status                                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| Approved shared store in repository | **None**                                                         |
| Agent vendor selection              | Forbidden                                                        |
| Decision matrix                     | [../operations/RATE_LIMITING.md](../operations/RATE_LIMITING.md) |
| Sensitive pilot mutations           | `BLOCKED` until distributed implementation `VERIFIED`            |
| Process-local limiter               | Not production-grade                                             |

### F — Monitoring and response

Configure alerts per [../operations/SERVICE_OPERATIONS.md](../operations/SERVICE_OPERATIONS.md) for: apex availability, readiness failure, auth failures, API 5xx, latency, DB connectivity, background jobs, notification failures, CSP reports, security events, participant isolation failures, consent enforcement failures.

Every alert needs: threshold, window, severity, owner, deputy, channel, ack target, escalation, participant impact, runbook, safe degraded mode.  
External configuration: `OWNER_ACTION_REQUIRED`.

## Recommended PR order (human merges only)

1. **#388** after Preview CSP evidence + independent security review — production CSP report-only
2. **#389** rebase after #388 merge — combined tests + manual a11y/privacy — panel flag false until approved
3. **#382** after staging recon + PITR + human walkthrough — AT Continuity stays disabled at merge
4. **Geoscape** separate — licensing/privacy → #367 → retarget #384 — depth ≤3 — no fifth PR

Agents do **not** merge, close, retarget, or mark ready.

## Human release session

| Item                  | Status                     | Doc                                                                                                                  |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Ordered session       | `NOT_RUN`                  | [../operations/CONTROLLED_PILOT_RELEASE_SESSION.md](../operations/CONTROLLED_PILOT_RELEASE_SESSION.md)               |
| Manual AT matrix      | `NOT_RUN`                  | [../accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md](../accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md) |
| Golden journeys G1–G9 | `NOT_RUN`                  | [../operations/CONTROLLED_PILOT_GOLDEN_JOURNEYS.md](../operations/CONTROLLED_PILOT_GOLDEN_JOURNEYS.md)               |
| G10 AT Continuity     | `BLOCKED` until #382 gates | Charter                                                                                                              |

## Responsibility matrix

Fill names only in the charter: [../operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md) — all roles currently `OWNER_ACTION_REQUIRED`. Implementer ≠ final release approver.

## Preview / production flags (must stay false in production until recorded decision)

| Flag                                         | Production    | Notes                         |
| -------------------------------------------- | ------------- | ----------------------------- |
| `MAPABLE_CSP_ENFORCE_PREVIEW`                | hard-off      | Preview-only when owner tests |
| `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL` | default false |                               |
| `MAPABLE_AT_CONTINUITY_ENABLED`              | default false |                               |

## Stop conditions

See charter — non-waivable for critical safety/privacy/isolation defects.
