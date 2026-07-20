# NDIS Expansion — PR Reconciliation

**Inspection date:** 2026-07-20  
**Base tip:** `origin/main` @ `8f64dc3845288dc42beefb35cdea95b9ca28dba5`  
**Rule:** A PR merged into another unmerged feature branch is **not** available on `main`.

## Classification vocabulary

| Class | Meaning |
|-------|---------|
| already on main | Merge commit is an ancestor of current `main` |
| reusable | Tip contains extractable patterns; not landed as SoT |
| overlapping | Touches the same product surface as an expansion wave |
| superseded | Replaced by a later tip or by landed main work |
| unsafe | Would violate lane, AI, migration, or claim discipline if merged as-is |
| feature-branch-only | Merged into a feature branch that is not on `main` |
| requires extraction | Useful code must be rebased/extracted onto current `main` |
| requires closure | Human should close or supersede to reduce backlog noise |
| external blocker | Blocked by account-owner, registration, partner, or migration evidence |

## Named PRs

| PR | State | Base → Head | Classification | Expansion relevance |
|----|-------|-------------|----------------|---------------------|
| **#378** | **MERGED** into `main` | `main` ← `cursor/wave0-stabilisation-repair-2794` | **already on main** | Controlled-pilot remediation; tip of inspected `main` |
| **#188** | OPEN (ready) | `main` ← `cursor/mapable-coordinate-f2cb` | **overlapping** · **requires extraction** · CONFLICTING | Support Coordination UI/module — Wave 3 must reuse SC SoT on main, not treat #188 as landed |
| **#189** | OPEN draft | `main` ← `cursor/abilitypay-mvp-b449` | **overlapping** · **requires extraction** · CONFLICTING | AbilityPay / plan budgets — Wave 10 precursor; not on main |
| **#241** | MERGED | `agent/careos-participant-marketplace` ← `agent/careos-abilitypay-home-living` | **feature-branch-only** · **requires extraction** | Home Living governance — **not** ancestor of `main` |
| **#243** | MERGED | `agent/careos-identity-authority` ← `agent/careos-support-coordination` | **feature-branch-only** · **requires extraction** | Support Coordination OS — **not** on `main` |
| **#245** | MERGED | `agent/careos-transport-command` ← `agent/careos-moves-rehabilitation` | **feature-branch-only** · **requires extraction** | Moves rehabilitation — **not** on `main` |
| **#286** | OPEN draft | `main` ← `cursor/ndis-canonical-domain-4203` | **overlapping** · **reusable** · currently MERGEABLE | NDIS Gateway canonical domain — treat as open PR, not landed SoT |
| **#294** | OPEN draft | `main` ← `cursor/quality-safeguards-ops-b684` | **overlapping** · **requires extraction** · CONFLICTING | Quality & Safeguards Ops — Wave 5 adjacent |
| **#318** | OPEN draft | `main` ← `feat/wave-17-inclusive-life-planner` | **overlapping** · **requires extraction** · CONFLICTING | Community participation / life planning — adjacent to Connect lane |

### Merge ancestry checks (feature-branch-only)

Verified at inspection: merge commits for #241 (`ccf3a1b0…`), #243 (`80f8613f…`), and
#245 (`ea74877e…`) are **not** ancestors of `origin/main`. Do not schedule Wave 4/3
product work as if those CareOS tips were already on main.

## Platform and migration blockers

| Item | Classification | Evidence / action |
|------|----------------|-------------------|
| Migrate-from-zero CI | **external blocker** | Hard fail P3018 on `20260525000000_mapable_access_phase_1` — see [MIGRATE_FROM_ZERO_BLOCKER.md](../remediation/MIGRATE_FROM_ZERO_BLOCKER.md). Account-owner `_prisma_migrations` evidence required before historical rewrite. |
| Feature freeze | **external blocker** (programme control) | [FEATURE_FREEZE.md](../remediation/FEATURE_FREEZE.md) — no new Prisma product domains until freeze lift or explicit waiver |
| Live NDIA claim submission | **external blocker** | Formal authorisation absent; flags must stay false |
| Automated payment approval | **external blocker** / permanent product prohibition for AI | Must stay false |
| MapAble Managed Support | **external blocker** | Registration, workforce, insurance, governance not proven — do not claim |
| NDIA / NDIS Commission APIs | **external blocker** | No formal documented authorised access on main |

## Recommended human actions (non-executing)

Wave 0 documents recommendations only. It does **not** close, merge, or rebase foreign PRs.

| Target | Suggested ledger action |
|--------|-------------------------|
| #188, #189, #294, #318 | `rebase` or `recreate` onto green `main` after migration trust; extract only what maps to Waves 3/5/10 |
| #241, #243, #245 | `retain_as_reference` + `extract` into wave PRs when prerequisites clear; do not merge CareOS trains wholesale |
| #286 | Review against [NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md); avoid second catalogue/participant SoT |
| Migration trust | Separate repair PR after account-owner evidence — not part of product Wave 1 |
| Draft backlog (100+ open drafts) | Out of scope for NDIS Expansion Wave 0; follow [PR_ACTION_LEDGER.md](../remediation/PR_ACTION_LEDGER.md) stack depth ≤ 3 |

## Stack discipline for this programme

- Maximum **three** stacked unmerged PRs
- Prefer each wave from latest merged `main`
- Do not open Wave *n+3* while Wave *n* is unmerged
- Avoid stacking product migrations wherever possible
- This Wave 0 PR targets `main` directly and adds **no** product migration

## Related

- [NDIS_EXPANSION_DELIVERY_SEQUENCE.md](./NDIS_EXPANSION_DELIVERY_SEQUENCE.md)
- [docs/remediation/PR_ACTION_LEDGER.md](../remediation/PR_ACTION_LEDGER.md)
- [docs/programmes/BRANCH_RECONCILIATION.md](./BRANCH_RECONCILIATION.md)
