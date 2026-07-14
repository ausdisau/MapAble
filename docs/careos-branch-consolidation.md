# CareOS phase branch consolidation

**Date:** 2026-07-14  
**Completion branch:** `agent/careos-platform-completion`  
**Stack tip (PR base):** `agent/careos-national-platform` @ `ae945e25`  
**Source audit:** `docs/careos-completion-audit.md`

This document records the disposition of every CareOS phase branch relative to the national platform tip. It is the canonical map for merge/retire decisions during platform completion.

---

## How to read this map

| Disposition | Meaning |
|-------------|---------|
| **Already contained** | Feature commits from the branch are present on the tip; no further merge required except housekeeping. |
| **Schema reconciliation (Task A)** | Code merged but Prisma/migration SoR conflict remains; integration lead owns unification. |
| **Integrate via adapters only** | Do not merge UI/advertising noise; wire through bounded adapters (Tasks J/K). |
| **Historical / superseded** | Open draft PRs remain for audit; completion PR supersedes for productionisation. |

**Note on reverse PR merge-commits:** Early phase branches (`agent/careos-cloud-platform` through `agent/careos-support-coordination`) show merge-commit noise on the tip from reverse PR merges. These commits carry no unique feature delta — treat them as integration bookkeeping, not missing work.

---

## Phase branch disposition

| Branch | vs tip | Disposition | Notes |
|--------|--------|-------------|-------|
| `agent/mapable-intelligence-fabric` | Code merged; schema quarantined | **Schema reconciliation (Task A)** | Fabric `CareOSMission` shape and CREATE migration moved to `docs/merge-pending/mapable-intelligence-fabric/`. Raw SQL writers must be rewritten to Prisma against extended tip schema. |
| `agent/careos-cloud-platform` | Contained | **Already contained** | Reverse PR merge-commit only on tip. |
| `agent/careos-production-foundation` | Contained | **Already contained** | Policy, registry, redaction, autonomy ceiling on tip. |
| `agent/careos-life-twin` | Contained | **Already contained** | Simulation paths; no separate SoR. |
| `agent/careos-provider-workforce` | Contained | **Already contained** | Shift offers, eligibility; cancellation recovery completion in Task C. |
| `agent/careos-participant-marketplace` | Contained | **Already contained** | Discovery/shortlist; post-discovery UX in Task D. |
| `agent/careos-abilitypay-home-living` | Contained | **Already contained** | Reconcile helpers; full portals in Tasks E/F. |
| `agent/careos-transport-command` | Contained linearly | **Already contained** | Continuity recovery, command centre. |
| `agent/careos-support-coordination` | Contained | **Already contained** | Reverse PR merge-commit only on tip. |
| `agent/careos-national-platform` | **Is the tip** | **Stack base** | Completion PR targets this branch. |
| `agent/careos-platform-completion` | Active completion work | **In progress** | Parallel slices B–Q; Task A owned by integration lead on shared files. |

---

## Parallel product surfaces (do not merge wholesale)

| Surface | Branch marker | Disposition |
|---------|---------------|-------------|
| Academy → competency | Academy feature branch | **Integrate via adapters only (Task J)** |
| Access evidence marker | Access map branch | **Integrate via adapters only (Task K)** |
| Public Access map UI | Separate advertising/UI | **Adapters only** — no nav or marketing merge |

---

## Schema and migration conflicts (Task A gate)

Until Task A completes:

1. **Do not reapply** quarantined migration `20260713112000_careos_operational_state` — it CREATEs `careos_missions` with a fabric shape incompatible with tip `20260713220727_careos_foundation`.
2. **Do not enable** fabric raw-SQL persistence against the tip table without the Prisma rewrite.
3. **Retain** additive migration `20260713110000_careos_action_receipts` only after tip models exist.

See `docs/merge-pending/mapable-intelligence-fabric/README.md` for quarantine detail.

---

## Intelligence code trees (single SoR target)

| Path | Current role | Target |
|------|--------------|--------|
| `packages/intelligence-kernel/` | Shared capability/authz primitives | Keep |
| `intelligence/` | Fabric network + kernel v1 (raw SQL) | Rewrite persistence to Prisma (Task A) |
| `lib/intelligence/careos/` | Tip CareOS orchestrator (Prisma missions) | Extend as canonical orchestration |
| `lib/intelligence/mainframe/` | Synthetic mainframe (flag-isolated) | Keep isolated |

---

## Open draft PRs (#242–#251)

Historical phase-chain PRs remain for traceability. The **completion PR** from `agent/careos-platform-completion` → `agent/careos-national-platform` supersedes them for production readiness gates (§23–§24 of programme brief).

---

## Definition of done for consolidation

Consolidation is complete when:

- One Prisma `CareOSMission` SoR with fabric fields merged (Task A).
- Quarantine directory emptied or archived with migration replay tested on clean DB.
- No runtime path uses `$executeRaw` against incompatible mission columns.
- Phase branches marked **already contained** need no re-merge.
- Journey, security, and accessibility suites green on completion branch.
