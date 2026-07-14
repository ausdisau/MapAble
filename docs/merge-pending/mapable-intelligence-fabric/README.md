# Merge pending: `agent/mapable-intelligence-fabric` → CareOS national tip

Date: 2026-07-14  
Target branch: `agent/careos-national-platform`  
Source: `origin/agent/mapable-intelligence-fabric`

## Simple conflicts — resolved

| File | Resolution |
|------|------------|
| `package.json` | Kept CareOS workspace deps (`@mapable/domain-transport`, `@mapable/domain-provider`, `@mapable/domain-workforce`) and accepted fabric’s additive `mcp:careos` script (already present on both sides post-merge). |

No other Git content conflicts were reported by `git merge`.

## Complicated conflicts — not auto-unified

### 1. Competing `CareOSMission` architectures (conflicting intent)

Both lineages define `model CareOSMission` mapped to table `careos_missions`, with incompatible shapes:

| Aspect | CareOS cloud tip (`prisma/schema.prisma`) | Fabric (`careos.prisma`) |
|--------|-------------------------------------------|---------------------------|
| Purpose | Modular monolith CareOS mission + recommendations / evidence / activity | Agentic network mission graph with events + human reviews |
| Columns | `missionType`, `inputSummary`, `status` default `proposed` | `goal`, `modules[]`, `graphJson`, `alertsJson`, `proposalsJson` |
| Relations | `User`, `CareOSRecommendation`, `CoordinationCase` | `CareOSMissionEvent`, `CareOSHumanReview` |
| Persistence | Prisma client (`prisma.careOSMission`) | Mostly `$executeRaw` INSERTs expecting fabric columns |

Migrations both `CREATE TABLE "careos_missions"`:

- Fabric: `20260713112000_careos_operational_state`
- Tip: `20260713220727_careos_foundation`

Applying both on a fresh database fails. Choosing either side silently deletes the other mission system’s contract.

### 2. Quarantine applied (unblock validate only)

To keep `pnpm prisma validate` working after merge, fabric’s conflicting artefacts were moved **out of the Prisma load/migrate path** (not deleted):

```text
docs/merge-pending/mapable-intelligence-fabric/careos.prisma
docs/merge-pending/mapable-intelligence-fabric/20260713112000_careos_operational_state/
```

Retained additive fabric migration (no table clash with tip CareOS mission):

```text
prisma/migrations/20260713110000_careos_action_receipts/
```

Fabric application code under `intelligence/`, `app/api/intelligence/`, `app/careos/`, components, and tests remains merged for review. Runtime paths that `$executeRaw` fabric mission columns against the tip `careos_missions` table will not work until schemas are unified.

### 3. Required human decision

Pick one consolidation path (do not leave both SoRs):

1. **Extend tip `CareOSMission`** with optional fabric columns + reverse relations; rewrite fabric persistence to Prisma client; drop/rework fabric’s CREATE TABLE migration.  
2. **Adopt fabric mission as SoR** and migrate tip recommendation/evidence/activity + Phase 7 `linkedMissionId` consumers onto fabric shape.  
3. **Two tables** (e.g. `careos_missions` vs `careos_network_missions`) with an explicit bridge — only if product truly needs both concepts.

Until that decision is implemented, treat fabric mission operational persistence as **pending**, not production-ready on this tip.

## Auto-merged (no conflict markers) — still review

- `components/layout/DashboardNav.tsx` — fabric CareOS nav links added  
- `components/ui/button.tsx` — fabric Button variant/size restore  
- Broad new `intelligence/` tree and CareOS MCP server  

These are additive but sit on the unresolved mission SoR above.
