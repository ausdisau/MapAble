# NDIS Expansion — PR Reconciliation

**Inspection date:** 2026-07-20 (truth/controls refresh)  
**Base tip:** `origin/main` @ `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Rule:** A PR merged into another unmerged feature branch is **not** available on `main`.

## Classification vocabulary

| Class               | Meaning                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| already on main     | Merge commit is an ancestor of current `main`                          |
| reusable            | Tip contains extractable patterns; not landed as SoT                   |
| overlapping         | Touches the same product surface as an expansion wave                  |
| superseded          | Replaced by a later tip or by landed main work                         |
| unsafe              | Would violate lane, AI, migration, or claim discipline if merged as-is |
| feature-branch-only | Merged into a feature branch that is not on `main`                     |
| requires extraction | Useful code must be rebased/extracted onto current `main`              |
| requires closure    | Human should close or supersede to reduce backlog noise                |
| external blocker    | Blocked by account-owner, registration, partner, or migration evidence |

## Named PRs (current)

| PR                      | State            | Base → Head                                                                    | Classification                                           | Expansion relevance                                                                                                                    |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **#381**                | **MERGED**       | `main` ← migration trust repair                                                | **already on main**                                      | Empty-DB migrate-from-zero green                                                                                                       |
| **#380**                | **MERGED**       | `main` ← NDIS Expansion Wave 0                                                 | **already on main**                                      | Docs/registry only                                                                                                                     |
| **#378**                | **MERGED**       | `main` ← Wave 0 repair                                                         | **already on main**                                      | Controlled-pilot remediation                                                                                                           |
| **#382**                | OPEN draft       | `main` ← AT Continuity Wave 1                                                  | **overlapping** · CI repair in flight                    | Wave 1 product; flag off                                                                                                               |
| **#379**                | OPEN draft       | `main` ← PBS foundation                                                        | **overlapping** · **unsafe** as Wave 7 SoT · CONFLICTING | Uses `lib/positive-behaviour-support/**`; canonical planned owner is `lib/pbs-operations/**` — **blocked / extractable future Wave 7** |
| **#383**                | OPEN draft       | `main` ← VisionAccess contracts                                                | freeze review                                            | Not an NDIS Expansion wave; keep flags false                                                                                           |
| **#367/#384/#385/#386** | OPEN draft stack | Geoscape train depth **4**                                                     | **unsafe** stack policy                                  | Not NDIS Expansion; human must reduce depth ≤3                                                                                         |
| **#188**                | OPEN (ready)     | `main` ← Support Coordination UI                                               | **overlapping** · **requires extraction** · CONFLICTING  | Wave 3 must reuse SC SoT on main                                                                                                       |
| **#189**                | OPEN draft       | `main` ← AbilityPay                                                            | **overlapping** · **requires extraction** · CONFLICTING  | Wave 10 precursor; not on main                                                                                                         |
| **#241**                | MERGED           | `agent/careos-participant-marketplace` ← `agent/careos-abilitypay-home-living` | **feature-branch-only** · **requires extraction**        | Home Living governance — **not** ancestor of `main`                                                                                    |
| **#243**                | MERGED           | `agent/careos-identity-authority` ← `agent/careos-support-coordination`        | **feature-branch-only** · **requires extraction**        | Support Coordination OS — **not** on `main`                                                                                            |
| **#245**                | MERGED           | `agent/careos-transport-command` ← `agent/careos-moves-rehabilitation`         | **feature-branch-only** · **requires extraction**        | Moves rehabilitation — **not** on `main`                                                                                               |
| **#286**                | OPEN draft       | `main` ← NDIS Gateway canonical                                                | **overlapping** · **reusable**                           | Not landed SoT                                                                                                                         |
| **#294**                | OPEN draft       | `main` ← Q&S Ops                                                               | **overlapping** · **requires extraction** · CONFLICTING  | Wave 5 adjacent                                                                                                                        |
| **#318**                | OPEN draft       | `main` ← inclusive life planner                                                | **overlapping** · **requires extraction** · CONFLICTING  | Adjacent to Connect lane                                                                                                               |

### Merge ancestry checks (feature-branch-only)

Verified at inspection: merge commits for #241 (`ccf3a1b0…`), #243 (`80f8613f…`), and
#245 (`ea74877e…`) are **not** ancestors of `origin/main`. Do not schedule Wave 4/3
product work as if those CareOS tips were already on main.

## Platform and migration blockers

| Item                                         | Classification                                      | Evidence / action                                                                                                  |
| -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Migrate-from-zero empty DB                   | **already remediated on main**                      | #381; CI `Migrate from zero` green — see [MIGRATE_FROM_ZERO_REPAIR.md](../remediation/MIGRATE_FROM_ZERO_REPAIR.md) |
| Production migration checksum / rename drift | **external blocker**                                | `OWNER_ACTION_REQUIRED` — staging rehearsal + owner SQL only                                                       |
| Feature freeze                               | **programme control**                               | Active; AT Continuity narrow waiver for #382 only                                                                  |
| Live NDIA claim submission                   | **external blocker**                                | Formal authorisation absent; flags must stay false                                                                 |
| Automated payment approval                   | **external blocker** / permanent prohibition for AI | Must stay false                                                                                                    |
| MapAble Managed Support                      | **external blocker**                                | Registration, workforce, insurance, governance not proven — do not claim                                           |
| NDIA / NDIS Commission APIs                  | **external blocker**                                | No formal documented authorised access on main                                                                     |
| Branch protection independent review         | **external blocker**                                | `OWNER_ACTION_REQUIRED`                                                                                            |

## Recommended human actions (non-executing)

This document does **not** close, merge, or rebase foreign PRs.

| Target                 | Suggested ledger action                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| #382                   | Repair format + a11y OOM on existing branch; leave draft until green + human acceptance                               |
| #379                   | `close` or `recreate` later onto `lib/pbs-operations/**` for Wave 7 — do not merge as-is                              |
| #367→#386              | Reduce stack to ≤3 via merge/retarget/consolidate (human)                                                             |
| #188, #189, #294, #318 | `rebase`/`extract` when wave prerequisites clear                                                                      |
| #241, #243, #245       | `retain_as_reference` + `extract` into wave PRs when prerequisites clear; do not merge CareOS trains wholesale        |
| #286                   | Review against [NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md); avoid second catalogue/participant SoT |
| Production checksums   | Owner runbook only                                                                                                    |

## Stack discipline

- Maximum **three** stacked unmerged PRs
- Prefer each wave from latest merged `main`
- Do not open Wave _n+3_ while Wave _n_ is unmerged
- Avoid stacking product migrations wherever possible
