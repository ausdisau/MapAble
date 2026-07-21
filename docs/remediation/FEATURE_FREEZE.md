# Remediation — Feature Freeze

Temporary stabilisation policy for the MapAble remediation programme.

**Status:** active from PR 1 merge until programme Definition of Done (see remediation plan) or explicit executive lift.  
**Last verified:** 2026-07-20 (`main` @ `6279ab91`)

## Frozen (not permitted)

- New Prisma domains unrelated to canonicalisation or an **explicit narrow waiver** below
- New top-level `lib/*` “operating systems” or platform layers outside waived paths
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
- Deepening any open stack beyond **three** unmerged PRs

## Permitted during remediation

- Security fixes
- Accessibility fixes
- Test coverage
- Observability (no new external vendor during freeze without owner approval)
- Canonicalisation and migrations required for it
- Documentation corrections and readiness evidence ledgers
- Production configuration hardening
- Bug fixes
- Dead-code removal after proof of non-use
- Compatibility redirects
- Release engineering (CI, CODEOWNERS, branch protection docs, runbooks)
- Repair of existing open waived product PRs **without expanding scope**

## Capability introduction rule

No new capability may be added until its domain owner, source of truth, production state, security boundary, human-review boundary, test evidence, and public-claim status are explicit (see `DOMAIN_OWNERSHIP.md`, `CAPABILITY_INVENTORY.md`, and capability registry).

All capability flags must default **false** (`=== "true"` to enable).

## Narrow freeze waivers (explicit)

Waivers do **not** lift the global freeze. Flags stay default-false. No production enable. No clinical / emergency / registration claims.

| Waiver ID | PR / branch                                           | Domain path                                       | Notes                                                                                                        | Status                                         |
| --------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| W-AT-1    | #382 `cursor/ndis-expansion-wave1-at-continuity-0a20` | `lib/at-continuity/**`                            | Wave 1 AT Continuity scaffold only; additive migration; human-approved notifications                         | Active waiver; PR CI currently `FAILED`        |
| W-GEO-0   | #367 Geoscape Predictive                              | `lib/geoscape-predictive/**`                      | Address autocomplete adapters; flag default false                                                            | Active; stack parent                           |
| W-GEO-1   | #384–#386 (stacked)                                   | `lib/spatial/**` (+ related)                      | Address intelligence / approach / service areas — **stack depth 4 violates policy**; no further stack growth | Active but **stack-policy breach**             |
| W-VA-1    | #383 VisionAccess contracts                           | vision-access contracts / synthetic lens          | No camera/inference/migrations                                                                               | Active; review vs freeze each revision         |
| W-PBS-7   | #379 PBS foundation                                   | Non-canonical `lib/positive-behaviour-support/**` | **Not accepted as Wave 7 owner path**; canonical remains `lib/pbs-operations/**`                             | Waiver **rejected / blocked** pending recreate |

## Honesty labels

Demo, mock, scaffold, and pilot behaviour must be labelled honestly in UI, API, and docs. Feature flags are not assurance.
