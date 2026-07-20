# Remediation — Feature Freeze

Temporary stabilisation policy for the MapAble remediation programme.

**Status:** active from PR 1 merge until programme Definition of Done (see remediation plan) or explicit executive lift.

## Frozen (not permitted)

- New Prisma domains unrelated to canonicalisation
- New top-level `lib/*` “operating systems” or platform layers
- New AI agents or agent marketplaces
- New external integrations (except completing gated adapters already in tree)
- New public production claims
- New payment paths
- New consent systems (second SoT)
- New transport booking models (second SoT)
- New invoice models (second SoT)
- Speculative civic / OS / marketplace verticals
- Silent public route changes without compatibility redirects
- Pricing or financial behaviour changes without tests and migration notes
- Enabling real NDIA claim submission, autonomous safeguarding decisions, autonomous worker/driver assignment, or automatic payments/invoice approval

## Permitted during remediation

- Security fixes
- Accessibility fixes
- Test coverage
- Observability
- Canonicalisation and migrations required for it
- Documentation corrections
- Production configuration hardening
- Bug fixes
- Dead-code removal after proof of non-use
- Compatibility redirects
- Release engineering (CI, CODEOWNERS, branch protection, runbooks)

## Capability introduction rule

No new capability may be added until its domain owner, source of truth, production state, security boundary, human-review boundary, test evidence, and public-claim status are explicit (see `DOMAIN_OWNERSHIP.md`, `CAPABILITY_INVENTORY.md`, and later capability registry).

## Honesty labels

Demo, mock, scaffold, and pilot behaviour must be labelled honestly in UI, API, and docs. Feature flags are not assurance.

## Explicit domain waiver — AT Continuity (Wave 1)

**Authorised:** NDIS Expansion Wave 1 after migrate-from-zero green (#381) and Wave 0 docs (#380) on `main`.

| Field        | Value                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain       | Assistive Technology Continuity only                                                                                                             |
| Paths        | `lib/at-continuity/**`, `lib/config/at-continuity.ts`                                                                                            |
| Schema       | Additive `at_*` tables / enums in `20260720120000_at_continuity_wave1`                                                                           |
| Flag         | `MAPABLE_AT_CONTINUITY_ENABLED` remains default **false**                                                                                        |
| Still frozen | New OS layers, payments, second consent/audit, NDIA submit, auto payment approval, other NDIS Expansion product domains without their own waiver |
| Non-goals    | Clinical suitability SoT; emergency dispatch; marketplace taxonomy as asset register                                                             |
| Rollback     | Flag off; revert Wave 1 migration on non-prod if required                                                                                        |

This waiver does **not** lift the freeze globally.
