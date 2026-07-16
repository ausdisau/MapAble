# MapAble ConvergenceOS

ConvergenceOS is the architecture, schema, capability, branch, migration and release-control layer for the MapAble ecosystem.

## Foundational rule

- Cursor and AI agents may **propose** architecture.
- ConvergenceOS **records and validates** architecture.
- Authorised humans **approve** canonical decisions.
- GitHub and CI **execute** repository changes.

## What it is not

Not a business vertical, not a Git/GitHub/Prisma/CI replacement, not an automatic merge bot, not an automatic migration executor, and not an AI system with authority to change canonical domains.

## Wave 0 scope (this implementation)

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
```

3. Sign in as admin → `/admin/convergence` → **Run repository scan**
4. Review Domains, PRs, Dependencies, Collisions, Merge trains
5. Download plain-text report from the overview page
6. Disable flags to hide UI (data retained)

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
