# Branch reconciliation — MapAble programme foundation

**Generated:** 2026-07-16  
**Base commit:** `fdd22bb3` (`main`)  
**Foundation branch:** `cursor/shared-programme-foundation-7fa5`

## Repository state at inspection

| Item           | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Branch         | `main` (clean working tree)                                 |
| Remote         | `origin` → `github.com/ausdisau/mapableau-new`              |
| Workspace      | Root Next.js app + `apps/realtime-server` only              |
| Schema         | Single `prisma/schema.prisma` (~455 models)                 |
| Programme docs | **Absent** before this PR (`docs/programmes/` created here) |

### Naming collision

Existing repo **Phase 0** = public marketing site stabilisation (`docs/mapable/phase-0-implementation-report.md`).  
Programme **Prompt 0** = shared programme foundation (`docs/programmes/`). Do not conflate.

## Open pull requests (priority for later merges)

| PR                                                         | Branch                                      | State | Relevance to foundation                                             |
| ---------------------------------------------------------- | ------------------------------------------- | ----- | ------------------------------------------------------------------- |
| [#238](https://github.com/ausdisau/mapableau-new/pull/238) | `agent/careos-cloud-platform`               | OPEN  | CareOS cloud platform base                                          |
| [#252](https://github.com/ausdisau/mapableau-new/pull/252) | `agent/careos-platform-completion`          | DRAFT | **Canonical `CareOSMission`**, outbox relay, mission events         |
| [#264](https://github.com/ausdisau/mapableau-new/pull/264) | `cursor/access-intelligence-module-4b25`    | DRAFT | `AiAccessPassport`, Living Twin, fit engine                         |
| [#273](https://github.com/ausdisau/mapableau-new/pull/273) | `cursor/access-intelligence-expansion-6ea8` | OPEN  | Access Intelligence Waves 0–5 production expansion                  |
| [#275](https://github.com/ausdisau/mapableau-new/pull/275) | `cursor/mapable-aura-wave6-7-6ea8`          | OPEN  | AURA Waves 6–7 (fixtures, in-memory stores)                         |
| [#272](https://github.com/ausdisau/mapableau-new/pull/272) | `cursor/mapable-aura-wave4-5-6ea8`          | OPEN  | AURA proposal/execution gates                                       |
| [#278](https://github.com/ausdisau/mapableau-new/pull/278) | `cursor/platform-assurance-registry-ccbf`   | OPEN  | `RegulatorySourceVersion` — coordinate with `ProgrammeSourceRecord` |

### Remote branches (not yet PRs or stacked)

- `origin/cursor/careos-foundation-c70a` — early CareOSMission slice
- `origin/agent/mapable-intelligence-fabric` — intelligence kernel + CareOS MCP
- `origin/cursor/access-intelligence-physical-4b25` — physical systems simulator
- Multiple `agent/careos-*` opportunity branches

## What exists on `main` vs open branches

| Domain          | On `main`                             | Target canonical (post-merge)                                |
| --------------- | ------------------------------------- | ------------------------------------------------------------ |
| Mission / case  | `Case`, `CaseTask`, `CaseLink`        | `CareOSMission` (PR #252)                                    |
| Access passport | `AccessibilityProfile` (presentation) | `AccessPassport` (rename from `AiAccessPassport`, PR #273)   |
| Places          | `AccessPlace*` (new stack)            | `AccessPlace` + Living Access Twin extension                 |
| Consent         | `ConsentRecord`                       | `ConsentRecord` + `ParticipantAuthorityGrant`                |
| Audit           | `AuditEvent`                          | `AuditEvent` + transactional outbox (PR #252)                |
| AURA            | Not present                           | Waves 1–7 (proposal-only boundary regardless of maturity)    |
| Navigator       | `SupportCoordinatorRelationship`      | `NavigatorProfile` family (this PR)                          |
| Source registry | Not present                           | `ProgrammeSourceRecord` (this PR) + optional link to PR #278 |

## Merge risks

1. **`CareOSMission` schema conflict** — Do not add `CareOSMission` on foundation branch; use `MissionDependencyAdapter` bridging `Case` until PR #252 merges.
2. **`AiAccessPassport` vs `AccessPassport`** — Document rename target; programmes use adapter until PR #273 merges.
3. **PR #278 overlap** — `ProgrammeSourceRecord.regulatorySourceVersionId` reserved for optional FK when #278 lands.
4. **`AccessiblePlace` / `AccessPlace` drift** — New programme writes target `AccessPlace` only.
5. **AURA Waves 6–7** — Fixtures and in-memory stores; programmes must enforce proposal-only AI boundary independently.

## Recommended merge sequence onto `main` (before Prompt 1)

1. CareOS canonical mission + outbox (PR #252 chain)
2. Access Intelligence core + passport rename (PR #273)
3. AURA proposal/execution gates (PR #272+ when stable)
4. Platform assurance registry (PR #278) — link to programme source registry

## Prompt 0 branch strategy

This PR branches from `main` and adds:

- Documentation under `docs/programmes/`
- Additive Prisma models (navigator, source registry, trust ledger, authority grants)
- `lib/programmes/` contracts, adapters, invariants, flags
- Tests — no programme product UIs

Adapter bridges (`Case` → mission, fixture source/navigator) allow Prompts 1–12 to start without waiting for all open PRs to merge.
