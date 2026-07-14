# Merge pending: `agent/mapable-intelligence-fabric` → CareOS national tip

**Date:** 2026-07-14 (updated)  
**Target branch:** `agent/careos-national-platform`  
**Source:** `origin/agent/mapable-intelligence-fabric`  
**Status:** **Task A reconciliation underway**

---

## Current status (Task A — canonical mission SoR)

Integration lead is actively reconciling the dual `CareOSMission` architecture:

| Work item | Status |
|-----------|--------|
| Extend tip `CareOSMission` with fabric fields (`desiredOutcome`/`goal`, `graphJson`, `stateVersion`, `correlationId`, `tenantId`, `authorityDecisionId`, modules/alerts/proposals JSON) | **In progress** |
| Rewrite fabric raw SQL persistence to Prisma client | **In progress** |
| Add child models for mission events, human reviews, receipts, preferences | **In progress** |
| Quarantined CREATE migration | **Must NOT be reapplied** |
| Schema conflict resolution | **Resolved in design; pending validation** (clean-DB `migrate deploy`, not `db push`) |

Until validation passes, treat fabric mission **operational persistence as pending**, not production-ready.

---

## Simple conflicts — resolved

| File | Resolution |
|------|------------|
| `package.json` | Kept CareOS workspace deps (`@mapable/domain-transport`, `@mapable/domain-provider`, `@mapable/domain-workforce`) and accepted fabric’s additive `mcp:careos` script (already present on both sides post-merge). |

No other Git content conflicts were reported by `git merge`.

---

## Complicated conflicts — reconciliation path

### 1. Competing `CareOSMission` architectures (conflicting intent)

Both lineages define `model CareOSMission` mapped to table `careos_missions`, with incompatible shapes:

| Aspect | CareOS cloud tip (`prisma/schema.prisma`) | Fabric (`careos.prisma`) |
|--------|-------------------------------------------|---------------------------|
| Purpose | Modular monolith CareOS mission + recommendations / evidence / activity | Agentic network mission graph with events + human reviews |
| Columns | `missionType`, `inputSummary`, `status` default `proposed` | `goal`, `modules[]`, `graphJson`, `alertsJson`, `proposalsJson` |
| Relations | `User`, `CareOSRecommendation`, `CoordinationCase` | `CareOSMissionEvent`, `CareOSHumanReview` |
| Persistence | Prisma client (`prisma.careOSMission`) | Mostly `$executeRaw` INSERTs expecting fabric columns |

Migrations both `CREATE TABLE "careos_missions"`:

- Fabric (quarantined): `20260713112000_careos_operational_state`
- Tip (canonical): `20260713220727_careos_foundation`

**Applying the quarantined CREATE on a fresh database fails.** The chosen path is **extend tip `CareOSMission`** and drop/rework the fabric CREATE — not run both.

### 2. Quarantine applied (unblock validate only)

To keep `pnpm prisma validate` working after merge, fabric’s conflicting artefacts were moved **out of the Prisma load/migrate path** (not deleted):

```text
docs/merge-pending/mapable-intelligence-fabric/careos.prisma
docs/merge-pending/mapable-intelligence-fabric/20260713112000_careos_operational_state/
```

**Do not move these back into `prisma/migrations/` or merge them into `schema.prisma` without Task A completion.**

Retained additive fabric migration (no table clash with tip CareOS mission when tip SoR holds):

```text
prisma/migrations/20260713110000_careos_action_receipts/
```

Fabric application code under `intelligence/`, `app/api/intelligence/`, `app/careos/`, components, and tests remains merged for review. Runtime paths that `$executeRaw` fabric mission columns against the tip `careos_missions` table **will not work** until the Prisma rewrite lands.

### 3. Consolidation decision (locked for Task A)

**Path 1 — extend tip `CareOSMission`** (selected):

1. Extend tip model with optional fabric columns + reverse relations.
2. Rewrite fabric persistence to Prisma client.
3. Drop/rework fabric’s CREATE TABLE migration (quarantine permanent until archived).
4. Validate with disposable clean-DB `migrate deploy`.

Paths 2 (adopt fabric as SoR) and 3 (two tables) were rejected — one mission SoR is required per `docs/careos-completion-audit.md`.

---

## Auto-merged (no conflict markers) — still review

- `components/layout/DashboardNav.tsx` — fabric CareOS nav links added  
- `components/ui/button.tsx` — fabric Button variant/size restore  
- Broad new `intelligence/` tree and CareOS MCP server  

These are additive but depend on the unified mission SoR above.

---

## Historical context

This quarantine was introduced on 2026-07-14 to unblock `prisma validate` after merging `agent/mapable-intelligence-fabric` into the CareOS national stack. The merge preserved fabric intelligence code while preventing a fatal double-CREATE migration. Task A completion clears the quarantine by schema extension + Prisma rewrite, documented in `docs/careos-branch-consolidation.md`.
