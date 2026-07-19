# MapAble ConvergenceOS

ConvergenceOS is the architecture, schema, capability, branch, migration and release-control layer for the MapAble ecosystem.

## Foundational rule

- Cursor and AI agents may **propose** architecture.
- ConvergenceOS **records and validates** architecture.
- Authorised humans **approve** canonical decisions.
- GitHub and CI **execute** repository changes.

## What it is not

Not a business vertical, not a Git/GitHub/Prisma/CI replacement, not an automatic merge bot, not an automatic migration executor, and not an AI system with authority to change canonical domains.

## Wave 0 scope

Read-only registries:

- Canonical domain inventory
- Capability maturity labels (honest implemented ≠ production-supported)
- Branch / pull request / dependency graph (structured lists)
- Schema and migration collision findings (fixtures + deterministic engine)
- Advisory foundation merge train
- Architecture decision **proposals** (not auto-approved)
- Admin UI under `/admin/convergence`
- APIs under `/api/convergence/*`
- Advisory CI workflow (warnings; no hard fail unless enforced mode)

## Productisation Wave 0 (Connected Service Programme)

Extends ConvergenceOS with honest productisation controls (still advisory; no auto-merge):

- [PRODUCTISATION_MERGE_TRAIN.md](./PRODUCTISATION_MERGE_TRAIN.md) — `PRODUCTISATION_MERGE_TRAIN`
- [PUBLIC_CLAIM_REGISTRY.md](./PUBLIC_CLAIM_REGISTRY.md) — blocks production marketing ahead of maturity
- [PR action ledger](../remediation/PR_ACTION_LEDGER.md) — close / merge / split / consolidate actions
- [Productisation programme README](../productisation/README.md)

Seeds: `lib/convergence-os/seed/pr-action-ledger.ts`, `public-claims.ts`, `trains/productisation-merge-train.ts`.

## Iteration 2 scope (Waves 9–17, advisory)

Stacked on Wave 0. Still **AUDIT/ADVISORY** — no auto source rewrite, no auto-merge, no real product-branch merges from rehearsals.

| Surface | Docs / entry |
|---------|----------------|
| Architecture Constitution C-001…C-025 | [CONSTITUTION.md](./CONSTITUTION.md), `/admin/convergence/constitution` |
| Repository Digital Twin | [REPOSITORY_TWIN.md](./REPOSITORY_TWIN.md), `/admin/convergence/repository-twin` |
| Semantic domain resolver | `/admin/convergence/semantic` |
| Data + authority lineage (synthetic) | `/admin/convergence/lineage` |
| Blast-radius + counterfactuals | `/admin/convergence/blast-radius` |
| Merge/migration rehearsal lab | `/admin/convergence/rehearsal` |
| Agent preflight gateway | `/admin/convergence/agent-preflight` |
| Drift / parity / supply / ownership / journeys / federation | `/admin/convergence/ops` |

Seed: `POST /api/convergence/seed/iteration2` (admin; ConvergenceOS enabled).

## Feature flags

All default **false** / `audit`. See `.env.example` for `MAPABLE_CONVERGENCE_*`.

Auto-mutation flags are hard-disabled in code regardless of environment:

- `autoMergeEnabled = false`
- `autoMigrationEnabled = false`
- `autoDeleteEnabled = false`
- `autoFlagChangeEnabled = false`

## Local usage

1. Apply migration: `npx prisma migrate deploy`
2. Enable flags in `.env` for local audit (never in production without review):

```bash
MAPABLE_CONVERGENCE_OS_ENABLED=true
MAPABLE_CONVERGENCE_MODE=audit
MAPABLE_CONVERGENCE_DOMAIN_REGISTRY_ENABLED=true
MAPABLE_CONVERGENCE_CAPABILITY_CATALOGUE_ENABLED=true
MAPABLE_CONVERGENCE_BRANCH_GRAPH_ENABLED=true
MAPABLE_CONVERGENCE_SCHEMA_SCAN_ENABLED=true
MAPABLE_CONVERGENCE_MERGE_TRAIN_ENABLED=true
# Iteration 2 (optional, still advisory)
MAPABLE_CONVERGENCE_CONSTITUTION_ENABLED=true
MAPABLE_CONVERGENCE_TWIN_ENABLED=true
MAPABLE_CONVERGENCE_SEMANTIC_RESOLVER_ENABLED=true
MAPABLE_CONVERGENCE_LINEAGE_ENABLED=true
MAPABLE_CONVERGENCE_BLAST_RADIUS_ENABLED=true
MAPABLE_CONVERGENCE_REHEARSAL_ENABLED=true
MAPABLE_CONVERGENCE_AGENT_PREFLIGHT_ENABLED=true
MAPABLE_CONVERGENCE_DRIFT_ENABLED=true
MAPABLE_CONVERGENCE_ENV_PARITY_ENABLED=true
MAPABLE_CONVERGENCE_SUPPLY_CHAIN_ENABLED=true
MAPABLE_CONVERGENCE_OWNERSHIP_ENABLED=true
MAPABLE_CONVERGENCE_GOLDEN_JOURNEY_ENABLED=true
MAPABLE_CONVERGENCE_FEDERATION_ENABLED=true
```

3. Sign in as admin → `/admin/convergence` → **Run repository scan**
4. Optionally seed Iteration 2 from Ops / federation, or twin/constitution pages
5. Review Domains, Twin, Constitution, Lineage, Blast radius, Rehearsal, Agent preflight
6. Download plain-text report from the overview page
7. Disable flags to hide UI (data retained)

## Advisory CI

```bash
pnpm check:convergence-advisory
```

Or the GitHub Action `.github/workflows/convergence-advisory.yml`.

With `MAPABLE_CONVERGENCE_CI_GATE_ENABLED=false` (default), the job is a no-op success.  
With gate enabled and mode `audit`/`advisory`, critical findings print as **warnings** (exit 0).  
Enforced mode is reserved for a later wave and still does not auto-merge.

## Rollback

Set `MAPABLE_CONVERGENCE_OS_ENABLED=false`. Leave tables in place. Stop scanning.

## Human merge train

The stored train is **advisory**. Humans execute steps in GitHub (see plan §34). ConvergenceOS never merges PRs.
