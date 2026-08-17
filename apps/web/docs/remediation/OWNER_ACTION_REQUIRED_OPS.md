# Account-owner release pack (controlled pilot)

**Canonical pilot boundary:** [../operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md)  
**Rule:** Do not mark items `VERIFIED` unless the named owner performed them and recorded evidence. A checklist is not evidence.  
**Inspected tip (2026-07-25):** live apex still `dpl_MBD4G6ZZhRQ84iTqx2oc1sqZ3dVK`; latest Production attempt `dpl_7BRWChKYqTtro417wesyUz1ikmT3` (main `3991d763`) — **ERROR**.  
**Root cause (authenticated build logs):** `NEXT_PUBLIC_APP_URL` still insecure HTTP → `assertDeployedProductionEnv` fail-closed; `NEXTAUTH_URL` must match apex HTTPS origin.  
**Canonical owner checklist (same day):** [RELEASE_OWNER_ACTIONS_2026-07-25.md](./RELEASE_OWNER_ACTIONS_2026-07-25.md).  
**Agents must not** change Vercel Production env, DNS/TLS, GitHub rulesets, or payment accounts. Neon `_prisma_migrations` §3 A-continue was owner-approved separately and is complete.

## Ordered release procedure

### A — Vercel Production configuration

Owner sets **without disclosing values in chat or logs**:

1. `NEXTAUTH_URL=https://mapable.com.au`
2. `NEXT_PUBLIC_APP_URL=https://mapable.com.au` (must match)
3. Confirm Production branch is `main` and deploy the **approved remediation SHA** (not an older alias)
4. Record evidence form:

| Field                                                   | Value | Status                                                                                                                 |
| ------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Deployment ID                                           |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Commit SHA                                              |       | `OWNER_ACTION_REQUIRED` (must match reviewed remediation SHA)                                                          |
| Build result                                            |       | `OWNER_ACTION_REQUIRED` (prior `dpl_D6eih3Nn…` FAILED on HTTP env URLs)                                                |
| Canonical redirect result                               |       | `OWNER_ACTION_REQUIRED` (also fix expired `www` TLS cert)                                                              |
| Auth smoke (`/api/auth/session`, `/api/auth/providers`) |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Live endpoint (`/api/health/live`)                      |       | `OWNER_ACTION_REQUIRED` (apex currently 404 HTML — see [HEALTH_ENDPOINT_DIAGNOSIS.md](./HEALTH_ENDPOINT_DIAGNOSIS.md)) |
| Ready endpoint (`/api/health/ready`)                    |       | `OWNER_ACTION_REQUIRED`                                                                                                |
| Rollback result or rollback readiness                   |       | `OWNER_ACTION_REQUIRED`                                                                                                |

Read-only public probe (no secrets): `pnpm audit:https-gate`  
Redacted deploy artefact validator: `pnpm audit:deploy-evidence -- --evidence ./artifacts/deploy-evidence.redacted.json`  
Human session artefact validator: `pnpm audit:human-release-evidence -- --evidence ./artifacts/human-release-session.redacted.json`  
Branch protection audit: `pnpm audit:branch-protection`  
Migration A-continue §3 on Neon production: **done** (2026-07-25). Jul 16+ forward deploy still **held** — see [RELEASE_OWNER_ACTIONS_2026-07-25.md](./RELEASE_OWNER_ACTIONS_2026-07-25.md) §5.  
Independent security review checklist (not approval): [INDEPENDENT_REVIEW_388.md](./INDEPENDENT_REVIEW_388.md) — status `NOT_RUN`.  
Combined #388+#389 ephemeral results: [COMBINED_388_389_INTEGRATION.md](./COMBINED_388_389_INTEGRATION.md).

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

| Step                                                               | Status                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Migration inventory/checksum comparison (prod export 2026-07-25)   | Pre-drift `VERIFIED`; post–§3 **checksums aligned** ([WAVE1_A_CONTINUE_RECONCILIATION.md](./WAVE1_A_CONTINUE_RECONCILIATION.md) §5.2) |
| Empty-database migrate-from-zero (CI already proves disposable DB) | CI `VERIFIED`                                                                                                                         |
| Staging migration rehearsal                                        | `VERIFIED` on `wave1-migration-rehearsal`                                                                                             |
| Production `_prisma_migrations` §3 rename/checksum SQL             | `VERIFIED` applied 2026-07-25 (owner-approved)                                                                                        |
| Jul 16+ forward `migrate deploy` on production                     | `NOT_RUN` — **held** (separate release decision)                                                                                      |
| Snapshot / PITR                                                    | `NOT_RUN`                                                                                                                             |
| Restore + schema verification + app smoke                          | `NOT_RUN`                                                                                                                             |
| Measured RTO (target 4h) / RPO (target 1h)                         | `NOT_RUN` — targets not achieved until measured                                                                                       |
| Rollback decision recorded                                         | `OWNER_ACTION_REQUIRED`                                                                                                               |

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
