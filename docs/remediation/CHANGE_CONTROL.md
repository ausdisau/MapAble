# Remediation — Change Control

## Principles

1. Small, reviewable pull requests following `PR_MERGE_ORDER.md`
2. Fail closed when configuration or authority is missing
3. Human approval for consequential actions
4. Complete audit trails for sensitive disclosures and financial transitions
5. Additive migrations before deprecating legacy structures
6. Tests before promoting capability maturity
7. Document rollback procedures in each PR that touches data or public routes
8. No auto-merge; no hiding build/lint/test failures
9. No destructive migrations executed automatically

## Review requirements

| Change class                                                                                 | Reviewers                                                             |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Default                                                                                      | One independent reviewer                                              |
| Auth, consent, safeguarding, billing, payments, tenancy, encryption, participant-data export | Independent reviewer **plus** specialist second reviewer (CODEOWNERS) |

See `docs/operations/branch-protection.md`.

## Required checks before merge to `main`

- CI
- Migrations
- Security
- Accessibility
- Production claims
- Vercel preview (when configured)

## Migration change control

- Historical `migration.sql` bodies are immutable
- Folder rename for uniqueness (as in PR 1) must be inventoried in `MIGRATION_INVENTORY.md`
- Production applies via `prisma migrate deploy` only
- CI rejects `db push` references in production runbooks

## Rollback

Each PR must state:

1. Git revert safety (yes/no and caveats)
2. Migration forward/back notes
3. Feature-flag disable path if behaviour is gated
4. Public route compatibility if URLs change

## Finding status discipline

When updating remediation docs, classify findings as:

`verified` | `likely` | `needs_runtime_verification` | `not_present` | `already_remediated`

Do not mark a gap remediated merely because a file or model exists.
