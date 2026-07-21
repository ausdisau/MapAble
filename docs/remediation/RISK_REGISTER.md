# Remediation — Risk Register

**Last verified:** 2026-07-20  
**Main tip:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
Status values: `VERIFIED` | `FAILED` | `NOT_RUN` | `OWNER_ACTION_REQUIRED` | `BLOCKED` | `NOT_APPLICABLE` | `already_remediated`

Severity: critical | high | medium | low

| ID  | Risk                                                            | Severity    | FindingStatus                          | Target                   | Notes                                                 |
| --- | --------------------------------------------------------------- | ----------- | -------------------------------------- | ------------------------ | ----------------------------------------------------- |
| R01 | NDIS encryption falls back to `NEXTAUTH_SECRET` / static string | critical    | needs follow-up verification           | Runtime hardening        | Re-verify `lib/crypto/ndis.ts` fail-closed path       |
| R02 | Duplicate migration timestamp `20260525000000`                  | critical    | `already_remediated` (repo)            | —                        | Rename path documented; prod rename drift still owner |
| R03 | Branch protection / required checks not owner-verified          | critical    | `OWNER_ACTION_REQUIRED`                | Owner                    | API 403 / empty rulesets                              |
| R04 | ESLint ignored during builds; full lint OOM history             | high        | `VERIFIED` (historical)                | CI                       | Monitor lint job memory                               |
| R05 | Admin role grants all permissions ambiently                     | high        | `VERIFIED` (unless later PR closed it) | Auth hardening           | Confirm on tip before pilot                           |
| R06 | Accountability publish creates `published` in one step          | high        | `VERIFIED`                             | Q&S / portal             | No privacy/safeguarding reviews                       |
| R07 | Transport mock routing can masquerade as available              | high        | `VERIFIED`                             | Transport honesty        | Default provider `mock`                               |
| R08 | Parallel billing/invoice aggregates                             | high        | `VERIFIED`                             | Billing canonicalisation | Keep adapters honest                                  |
| R09 | Parallel transport booking models                               | high        | `VERIFIED`                             | Transport                | Bridge only                                           |
| R10 | Consent omission not fail-closed on all sensitive paths         | high        | `OWNER_ACTION_REQUIRED` / likely       | Consent                  | Sparse route-level checks                             |
| R11 | Many API routes pass raw JSON into services                     | high        | `VERIFIED`                             | Auth/API                 | Zod coverage incomplete                               |
| R12 | `/admin` and `/employer` middleware gap history                 | medium-high | needs re-verify                        | Auth                     | Layout guards may exist                               |
| R13 | Flags default-on via `!== "false"` pattern                      | medium-high | needs re-verify                        | Config                   | Prefer `=== "true"`                                   |
| R14 | Docs historically prescribed `prisma db push` for prod          | medium-high | `already_remediated` (gates)           | Claims CI                | Keep production docs honest                           |
| R15 | Xero / Stripe dual paths and stubs                              | medium      | `VERIFIED`                             | Billing                  | Placeholder sync                                      |
| R16 | Care invoice placeholders as financial state                    | medium      | `VERIFIED`                             | Care/billing             | Placeholder status                                    |
| R17 | Driver/employer UI shells auth-only                             | medium      | `VERIFIED`                             | Auth                     | API permissions stronger                              |
| R18 | Automated a11y only — no WCAG claim                             | medium      | `VERIFIED`                             | A11y                     | Manual matrix `NOT_RUN`                               |
| R19 | Public “NDIS registered” provider labels misread                | medium      | `VERIFIED`                             | Claims                   | Avoid MapAble certification implication               |
| R20 | Mobile contracts without offline security design                | medium      | `VERIFIED`                             | Mobile                   | Not a native production app                           |

## Residual / programme risks (2026-07-20)

| ID  | Risk                                                      | FindingStatus                                                                            |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| R21 | Deployed Vercel env missing dedicated encryption keys     | `OWNER_ACTION_REQUIRED`                                                                  |
| R22 | Live marketing pages over-claim availability              | `NOT_RUN` this rescan                                                                    |
| R23 | Production DB rename drift / checksum drift vs repo       | `OWNER_ACTION_REQUIRED`                                                                  |
| R24 | Migrate-from-zero empty DB P3018                          | **`already_remediated`** on `main` via #381 — do **not** list as active empty-DB blocker |
| R25 | CSP Report-Only with `unsafe-eval` (enforce not proven)   | `VERIFIED`                                                                               |
| R26 | Branch protection / independent approval not API-verified | `OWNER_ACTION_REQUIRED`                                                                  |
| R27 | Production edge may lag repository tip (JSON-LD / health) | `OWNER_ACTION_REQUIRED`                                                                  |
| R28 | Manual AT / zoom / reduced-motion evidence incomplete     | `NOT_RUN`                                                                                |
| R29 | Open PR stack depth 4 (#367→#386)                         | `FAILED` (policy)                                                                        |
| R30 | PR #382 CI format + Accessibility OOM                     | `FAILED`                                                                                 |
| R31 | PR #379 non-canonical PBS path vs `lib/pbs-operations/**` | `BLOCKED`                                                                                |
| R32 | In-memory IP rate limit treated as production-safe        | `BLOCKED` if used to justify prod enable                                                 |
| R33 | Backup/restore and incident tabletops not executed        | `NOT_RUN`                                                                                |

## Closure rule

No critical risk is accepted as closed merely because documentation exists. Closure requires tests, CI gates, and (for crypto/auth/billing) specialist review per `docs/operations/branch-protection.md`. Missing evidence stays `NOT_RUN` or `OWNER_ACTION_REQUIRED` — never a silent pass.
