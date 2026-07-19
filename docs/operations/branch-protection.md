# Branch protection — MapAble (`main`)

This document is the required configuration for GitHub branch protection on `main`. Apply these settings in the repository’s GitHub settings (Settings → Branches → Branch protection rules). CI cannot enforce protection settings itself; this file is the operational checklist.

**FindingStatus:** required checks listed below are `verified` as workflow files; whether they are enabled on the GitHub branch rule is `needs_runtime_verification` until an admin confirms.

**Repository ownership (Wave 0):** the repository is owned by personal GitHub user `ausdisau`, not an organisation. Specialist `@ausdisau/team-*` teams cannot exist until the repository is moved under a GitHub Organisation.

## Rules for `main`

1. **No direct push to `main`.** Require pull requests.
2. **No merge without at least one independent approving review.**
3. **Dismiss stale approvals** on new commits.
4. **Require status checks to pass before merging.** Do not allow bypass except break-glass admin with audit (no unrecorded administrator bypass).
5. **Do not allow auto-merge** for remediation or production-impacting PRs.
6. **Require branches to be up to date** before merging when feasible.
7. **Restrict who can push** to matching branches (maintainers only).

## Required status checks

Configure these check names to match the workflow job names exactly:

| Check             | Workflow                                  | Purpose                                                                               |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| CI                | `.github/workflows/ci.yml`                | Install, Prisma, type-check, format, lint, test, build, ownership/migration collision |
| Migrations        | `.github/workflows/migrations.yml`        | Ephemeral Postgres migrate-from-zero + integrity                                      |
| Security          | `.github/workflows/security.yml`          | Semgrep + prod audit gate + secret/fallback/route checks                              |
| Accessibility     | `.github/workflows/accessibility.yml`     | Playwright + axe smoke                                                                |
| Production claims | `.github/workflows/production-claims.yml` | Public claim / db push / certification language gates                                 |
| Vercel Preview    | Vercel GitHub integration                 | Preview deployment                                                                    |

Until Vercel is connected, mark Vercel Preview as required only when the integration is active (`needs_runtime_verification`).

## CODEOWNERS (immediate vs longer-term)

### Immediate (user-owned repository)

Root `CODEOWNERS` assigns `@ausdisau` for all paths. This is a valid GitHub user owner. It does **not** claim specialist team enforcement.

Specialist second review for auth, consent, safeguarding, billing, payments, tenancy, encryption, and participant-data export remains a **human process**: record the specialist review in the PR until an organisation exists.

### Longer-term (GitHub Organisation)

1. Create a GitHub Organisation and transfer the repository.
2. Create teams:

- `@org/mapable-maintainers` — default
- `@org/mapable-security` — auth, encryption, tenancy
- `@org/mapable-privacy` — consent, participant export
- `@org/mapable-safeguarding` — incidents / Q&S
- `@org/mapable-billing` — billing, payments, payouts

3. Restore team-based CODEOWNERS and enable required CODEOWNER reviews on `main`.

## Specialist second review paths

In addition to one independent reviewer, changes touching these paths require a second specialist approval (human-recorded until teams exist):

- Authentication and sessions (`lib/auth/**`, NextAuth routes)
- Consent (`lib/consent/**`, consent APIs)
- Safeguarding / incidents (`lib/incidents/**`, safety routes)
- Billing and invoices (`lib/billing/**`, `lib/billing-core/**`, `lib/invoices/**`)
- Payments (`lib/stripe/**`, payment/payout APIs)
- Tenancy / organisations (`lib/**/organisation*`, org membership)
- Encryption (`lib/crypto/**`, NDIS encryption)
- Participant-data export / vault paths

## Break-glass

Emergency hotfix to `main` requires:

1. Written reason in the PR
2. Post-merge follow-up issue within 24 hours
3. No silent disabling of required checks without audit note
