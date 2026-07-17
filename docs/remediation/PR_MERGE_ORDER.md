# Remediation — Pull Request Merge Order

Do **not** combine these into one mega-PR. Do **not** start PR N+1 until PR N builds, passes required checks, and has an independent review summary.

## Sequence

| PR  | Title                                   | Depends on | Scope                                                                                                    |
| --- | --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Repository controls                     | —          | Remediation docs, CODEOWNERS, CI, migration checks, lint enforcement, branch-protection docs, a11y smoke |
| 2   | Production configuration                | 1          | Typed env validation, encryption fail-closed, capability registry, claim checks, storage gating          |
| 3   | Auth, permission and tenancy hardening  | 2          | Server guards, tenant context, break-glass, negative access tests                                        |
| 4   | Consent canonicalisation                | 3          | ConsentDecision service, adapter, disclosure ledger, revocation tests                                    |
| 5   | Billing canonicalisation                | 3          | BillingInvoice SoT, evidence linkage, pricing version, recon foundation                                  |
| 6   | Care transaction completion             | 4, 5       | Agreements, recurrence, recovery, evidence invoicing, e2e                                                |
| 7   | Transport canonicalisation              | 4, 5       | Trip migration plan, access profiles, quotes, address protection                                         |
| 8   | Transport transaction completion        | 7          | Offline events, evidence, disputes, holds, e2e                                                           |
| 9   | Jobs transaction completion             | 6, 8       | Disclosure, interview a11y, retention, orchestration, e2e                                                |
| 10  | Quality and Safeguards Ops              | 3, 4       | Taxonomy, deadlines, investigation, corrective actions                                                   |
| 11  | Public Accountability Portal            | 5, 10      | Publication pipeline, methodology, suppression, corrections                                              |
| 12  | Observability and operational readiness | 6, 8, 11   | Telemetry, SLOs, runbooks, recovery                                                                      |
| 13  | Mobile and offline foundations          | 6, 8, 12   | Stable mobile API, encrypted offline queue, worker/driver flows                                          |

## Dependency graph

```text
PR1 → PR2 → PR3 → PR4 → PR6 → PR9
                 ↘ PR5 ↗     ↗
                 ↘ PR4 → PR7 → PR8 ↗
                 ↘ PR3 → PR10 → PR11 → PR12 → PR13
                         PR5 ↗        ↗
                         PR6/PR8 ─────┘
```

## PR 1 exit criteria (gate for PR 2)

- [ ] CI workflow green (install, prisma, type-check, format, lint, test, build, ownership/migration collision checks)
- [ ] Migrations workflow green (from-zero apply on ephemeral Postgres)
- [ ] Security workflow green (Semgrep retained + additional gates)
- [ ] Accessibility workflow green (Playwright + axe smoke)
- [ ] Production-claims workflow green
- [ ] Concise review summary; no unrelated product features
- [ ] Duplicate migration timestamp repaired and inventoried
