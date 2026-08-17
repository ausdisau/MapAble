# Remediation — Feature Freeze

Temporary stabilisation policy for the MapAble remediation programme.

**Status:** active from PR 1 merge until programme Definition of Done (see remediation plan) or explicit executive lift.  
**Last verified:** 2026-07-27 (`main` @ `dd5ff9fc`)

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

| Waiver ID | PR / branch                                               | Domain path                                                                                                                             | Notes                                                                                                             | Status                                                        |
| --------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| W-AT-1    | #382 `cursor/ndis-expansion-wave1-at-continuity-0a20`     | `lib/platform/at-continuity/**`                                                                                                         | Wave 1 AT Continuity scaffold only; additive migration; human-approved notifications                              | Active waiver; PR CI currently `FAILED`                       |
| W-GEO-0   | #367 Geoscape Predictive                                  | `lib/geoscape-predictive/**`                                                                                                            | Address autocomplete adapters; flag default false                                                                 | Active; stack parent                                          |
| W-GEO-1   | #384–#386 (stacked)                                       | `lib/spatial/**` (+ related)                                                                                                            | Address intelligence / approach / service areas — **stack depth 4 violates policy**; no further stack growth      | Active but **stack-policy breach**                            |
| W-VA-1    | #383 VisionAccess contracts                               | vision-access contracts / synthetic lens                                                                                                | No camera/inference/migrations                                                                                    | Active; review vs freeze each revision                        |
| W-PBS-7   | #379 PBS foundation                                       | Non-canonical `lib/positive-behaviour-support/**`                                                                                       | **Not accepted as Wave 7 owner path**; canonical remains `lib/pbs-operations/**`                                  | Waiver **rejected / blocked** pending recreate                |
| W-AA-1    | `cursor/autonomy-assurance-prompt-0-59aa` (+ Train A/B/C) | `lib/ai/platform/capabilities/**` (ARC sidecar), `lib/aura-harness/**`, `lib/trust/fabric/**`, `lib/act/handoff/**`, related docs/tests | Autonomy Assurance programme — deepen Trust Fabric + AURA harness; flags default false; see explicit waiver below | Active for Prompt 0 docs; product prompts require this waiver |

## Honesty labels

Demo, mock, scaffold, and pilot behaviour must be labelled honestly in UI, API, and docs. Feature flags are not assurance.

## Explicit domain waiver — AT Continuity (Wave 1)

**Authorised:** NDIS Expansion Wave 1 after migrate-from-zero green (#381) and Wave 0 docs (#380) on `main`.

| Field        | Value                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain       | Assistive Technology Continuity only                                                                                                             |
| Paths        | `lib/platform/at-continuity/**`, `lib/config/at-continuity.ts`                                                                                   |
| Schema       | Additive `at_*` tables / enums in `20260720120000_at_continuity_wave1`                                                                           |
| Flag         | `MAPABLE_AT_CONTINUITY_ENABLED` remains default **false**                                                                                        |
| Still frozen | New OS layers, payments, second consent/audit, NDIA submit, auto payment approval, other NDIS Expansion product domains without their own waiver |
| Non-goals    | Clinical suitability SoT; emergency dispatch; marketplace taxonomy as asset register                                                             |
| Rollback     | Flag off; revert Wave 1 migration on non-prod if required                                                                                        |

This waiver does **not** lift the freeze globally.

## Explicit domain waiver — AI Autonomy Assurance (W-AA-1)

**Authorised:** after Prompt 0 reconciliation
([`docs/ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](../ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md))
against `main` @ `dd5ff9fc`. Extends existing Trust Fabric and AURA harness; does **not** create a new top-level OS.

| Field        | Value                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain       | AI Autonomy Assurance (TrustX ARC sidecar, AURA v2 shadow, Dignity of Risk, Decision Passport projection, A2H hardening, evidence choreography)                                                                                                    |
| Paths        | `lib/ai/platform/capabilities/**` (ARC sidecar), `lib/aura-harness/**`, `lib/trust/fabric/**`, `lib/act/handoff/**`, `intelligence/actions/**` (Governed Envelope v2 attachment), related `docs/ai-platform/**` / `docs/productisation/**` / tests |
| Schema       | Additive only under those domains; no second consent/authority SoT tables disguised as wallets or delegation ledgers                                                                                                                               |
| Flags        | All new/changed capability flags remain default **false** (`=== "true"` to enable); Trust Fabric permanent denials stay hard-coded off                                                                                                             |
| Public claim | `internal_alpha` / `not_claimable` — no public production claims                                                                                                                                                                                   |
| Stack        | Fresh Train A / B / C stacks, each ≤ **3** unmerged product PRs; do **not** deepen Geoscape W-GEO-1 or other breached stacks                                                                                                                       |
| Still frozen | `lib/aura/` Agent OS; new AI agent marketplaces; second consent SoT; AI decision authority; automatic authority; autonomous payments/claims/safeguarding/assignment/restrictive practice/capacity inference                                        |
| Non-goals    | Wholesale merge of #299 / #311; RightsOS Decision Room; Decision Passport as legal delegation wallet; averaging away critical ARC dimensions; AURA memory replacing live consent/authority/stop checks                                             |
| Rollback     | Flags off; revert additive migrations on non-prod if required; Trust Fabric + harness return to prior default-off behaviour                                                                                                                        |

**Permanent prohibitions under this waiver:** no autonomous funding/claim/invoice/payment approval; support reduction; worker or driver assignment; worker suspension or punishment; clinical or behaviour-support decisions; restrictive-practice approval; safeguarding findings; consent alteration; capacity inference; mental-state inference from voice, face, gait, or behavioural telemetry.

This waiver does **not** lift the freeze globally.
