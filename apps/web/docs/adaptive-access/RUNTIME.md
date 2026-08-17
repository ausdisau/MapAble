# Adaptive Access Runtime

## Objective

Let participants control how MapAble presents information and interactions **without** altering legal, financial, clinical, or operational meaning.

## Scope (PR 1)

- `ParticipantAccessProfile` field contracts with source, approval, effective/expiry, disclosure, correction, revocation, version
- `PresentationPolicyResolver` (pure)
- Familiar-interface freeze (security fixes still apply)
- Surface adapters: participant dashboard, Starting Work, What Changed, service agreement review
- Feature flags default **false**
- No Prisma migration, no LLM, no production claims

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_ADAPT_RUNTIME_ENABLED` | false |
| `MAPABLE_ACCESS_PROFILE_ENABLED` | false |
| `MAPABLE_FAMILIAR_INTERFACE_ENABLED` | false |
| `MAPABLE_EASY_READ_PRESENTATION_ENABLED` | false |

## Canonical ownership

Extends `AccessibilityProfile` / Communication Passport projections. Does **not** create a new participant identity system.

## Authority ceiling

`PRESENTATION_ONLY` — `not_claimable` for public marketing.
