# Remediation — Pull Request Merge Order

Do **not** combine these into one mega-PR. Do **not** start PR N+1 until PR N builds, passes required checks, and has an independent review summary.

**Main tip at refresh:** `6279ab91`  
**Stack rule:** max three unmerged stacked PRs; prefer independent branches from `main`.

## Active remediation sequence (2026-07-20)

| Order | Title                                      | Depends on                                | Scope                                                                                         |
| ----- | ------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| A     | Repository truth and change controls       | current `main`                            | Evidence ledger, stale-doc repair, readiness CI consistency, PR stack map                     |
| B     | Repair existing #382 AT Continuity         | A reviewable; #381/#380 already on `main` | Format, a11y OOM diagnosis, acceptance tests; flag remains false                              |
| C     | Preview-gated runtime hardening            | A independently reviewable                | CSP nonce/preview enforce (not production), config tests, health/SLO docs, rate-limit honesty |
| D     | Human ops / a11y / golden-journey evidence | A–C as applicable                         | Owner actions + `NOT_RUN` until humans execute                                                |

## Historical canonicalisation sequence (unchanged intent)

| PR  | Title                                   | Depends on | Scope                                                             |
| --- | --------------------------------------- | ---------- | ----------------------------------------------------------------- |
| 1   | Repository controls                     | —          | Remediation docs, CODEOWNERS, CI, migration checks                |
| 2   | Production configuration                | 1          | Typed env validation, encryption fail-closed, capability registry |
| 3   | Auth, permission and tenancy hardening  | 2          | Server guards, tenant context, break-glass                        |
| 4   | Consent canonicalisation                | 3          | ConsentDecision service, revocation tests                         |
| 5   | Billing canonicalisation                | 3          | BillingInvoice SoT                                                |
| 6   | Care transaction completion             | 4, 5       | Agreements, recurrence, evidence invoicing                        |
| 7   | Transport canonicalisation              | 4, 5       | Trip migration plan, quotes                                       |
| 8   | Transport transaction completion        | 7          | Offline events, disputes                                          |
| 9   | Jobs transaction completion             | 6, 8       | Disclosure, retention                                             |
| 10  | Quality and Safeguards Ops              | 3, 4       | Investigation loop                                                |
| 11  | Public Accountability Portal            | 5, 10      | Publication pipeline                                              |
| 12  | Observability and operational readiness | 6, 8, 11   | Telemetry, SLOs, runbooks                                         |
| 13  | Mobile and offline foundations          | 6, 8, 12   | Stable mobile API                                                 |

## Dependency graph (historical)

```text
PR1 → PR2 → PR3 → PR4 → PR6 → PR9
                 ↘ PR5 ↗     ↗
                 ↘ PR4 → PR7 → PR8 ↗
                 ↘ PR3 → PR10 → PR11 → PR12 → PR13
                         PR5 ↗        ↗
                         PR6/PR8 ─────┘
```

## Exit criteria for sequence A (this PR)

- [ ] CI workflow green (install, prisma, type-check, format, lint, test, build, ownership/migration collision checks)
- [ ] Migrations + migrate-from-zero green (empty DB)
- [ ] `pnpm ci:readiness-evidence` green
- [ ] Security / production-claims / accessibility workflows green or explicitly `NOT_RUN` with reason
- [ ] Concise review summary; no unrelated product features
- [ ] No claim of production readiness without ledger evidence
