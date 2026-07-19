# Repository Digital Twin (Iteration 2 / Wave 10)

## Purpose

A versioned inventory of the MapAble codebase so ConvergenceOS can answer: where a capability lives, which modules write, which routes exist, which flags are declared, and how snapshots differ over time.

## What is captured

- Packages (workspace root + known workspace packages)
- Modules (catalogue keyed to programmes / canonical domains)
- API routes under `app/api/**/route.ts`
- Feature-flag-like entries from `.env.example`
- Repository graph edges (module → canonical domain `implements`)
- Hash set: schema, package graph, route graph, flag manifest, capability manifest

## How to run

1. Enable flags:

```bash
MAPABLE_CONVERGENCE_OS_ENABLED=true
MAPABLE_CONVERGENCE_TWIN_ENABLED=true
```

2. Apply migration `20260716230000_convergence_os_iteration2`
3. Admin → `/admin/convergence/repository-twin` → **Run twin scan**
4. Or `POST /api/convergence/scans/twin` as admin

## Guarantees

- Read-only against GitHub (no branch mutation)
- No auto-merge / auto-migration
- Comparison is hash-based and advisory
