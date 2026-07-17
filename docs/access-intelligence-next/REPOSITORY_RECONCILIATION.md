# Living Access Fabric — Repository Reconciliation

Verified against `main` after remediation (#300) and ConvergenceOS Train 1 (#302).

## Merge train status

| Order | Item | Action taken |
| --- | --- | --- |
| 0 | #300 remediation controls | **Merged** — CODEOWNERS, migrations/CI/security/a11y/production-claims workflows |
| 1 | ConvergenceOS #290 (⊃#289) | **Merged** via rebased #302; migrations renumbered to `20260717100000` / `20260717110000` |
| 2 | Access Intelligence tip | **#273** selected as canonical tip for `main`; #266 retained only as AURA rebase base |
| 3 | AURA stack #267–277 | Must rebase onto #273 / post-#273 `main`; renumber migrations away from Convergence stamps |
| 4 | ContinuityOS | **#288** selected; #287 retire; #301 parked |
| 5 | Supersede | #264 / #265 Access Intelligence slices — superseded by #273 |

## Access Intelligence tips

- **Canonical for main:** [#273](https://github.com/ausdisau/mapableau-new/pull/273) (`cursor/access-intelligence-expansion-6ea8`)
- **Do not merge as second SoR:** [#266](https://github.com/ausdisau/mapableau-new/pull/266)
- **Retire:** [#264](https://github.com/ausdisau/mapableau-new/pull/264), [#265](https://github.com/ausdisau/mapableau-new/pull/265)
- **AURA rebase base:** leave stack on #266 until rebased onto #273 tip

## ContinuityOS tips

- **Selected foundation:** [#288](https://github.com/ausdisau/mapableau-new/pull/288)
- **Retire duplicate:** [#287](https://github.com/ausdisau/mapableau-new/pull/287)
- **Park mega tip:** [#301](https://github.com/ausdisau/mapableau-new/pull/301)
- **Prerequisite:** CareOSMission SoR ([#252](https://github.com/ausdisau/mapableau-new/pull/252)) before Continuity binds mission state on `main`

## Feature freeze

Remediation `FEATURE_FREEZE.md` remains active for new operational writers and speculative OS layers. Access Intelligence Next Wave 0–2 is **contracts + synthetic fixtures only** (no Prisma migration, no new operational writer), which is permitted under documentation / release-engineering / honesty labelling.

## First Next PR policy

- Shared contracts, synthetic Harbour graph, read-only APIs behind flags
- **No** Prisma migration
- **No** live adapters, camera, Continuity execution, or AURA execution
