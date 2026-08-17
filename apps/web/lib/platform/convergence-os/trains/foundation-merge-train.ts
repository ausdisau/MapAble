import type { MergeTrainSeed } from "@/lib/platform/convergence-os/types";

/**
 * Advisory FOUNDATION + GOVERNANCE PREP merge train (plan §34).
 * Humans execute in GitHub. ConvergenceOS never auto-merges.
 */
export const FOUNDATION_MERGE_TRAIN: MergeTrainSeed = {
  trainKey: "foundation_governance_prep_v1",
  name: "FOUNDATION + GOVERNANCE PREP",
  trainType: "FOUNDATION",
  summary:
    "Advisory merge order for NDIS docs, programme foundation, assurance, vault-before-rightsos, civic/a11yops, deferred CareOSMission, rebuilt AI/AURA stack.",
  riskSummary:
    "Critical risks: CareOSMission multi-writer, PersonalVault dual-define, migration timestamp 20260716140000, indoor deletion on stale tips. No automated merge.",
  rollbackNotes:
    "Revert merge commits in reverse order; keep ConvergenceOS and product feature flags off; no data backfill assumed for greenfield registries.",
  steps: [
    {
      stepOrder: 0,
      action: "merge_docs_only",
      prNumber: 285,
      branchName: "cursor/ndis-gateway-audit-4203",
      evidence: "Docs-only NDIS Wave 0 audit; mergeable; low collision risk",
      humanOwner: "release_manager",
      rollback: "Revert #285",
    },
    {
      stepOrder: 1,
      action: "rebase_then_merge",
      prNumber: 279,
      branchName: "cursor/shared-programme-foundation-7fa5",
      evidence:
        "Rebase onto current main preserving indoor; resolve migration naming vs 20260716120000_indoor",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #279; CaseMissionAdapter unused",
    },
    {
      stepOrder: 2,
      action: "rebase_then_merge",
      prNumber: 278,
      branchName: "cursor/platform-assurance-registry-ccbf",
      evidence: "Stale tip drops indoor today; link sources to programme registry after #279",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #278",
    },
    {
      stepOrder: 3,
      action: "merge",
      prNumber: 286,
      branchName: "cursor/ndis-canonical-domain-4203",
      evidence: "Migration-free funding facades; rollback = revert lib",
      humanOwner: "database_reviewer",
      rollback: "Revert #286 lib/ndis-gateway",
    },
    {
      stepOrder: 4,
      action: "defer",
      prNumber: 252,
      branchName: "agent/careos-platform-completion",
      evidence:
        "Defer until extracted/rebased onto main with indoor preserved; mark AURA/Continuity depends_on CareOSMission SoR",
      humanOwner: "architecture_reviewer",
      rollback: "N/A — deferred",
    },
    {
      stepOrder: 5,
      action: "merge",
      prNumber: 281,
      branchName: "cursor/personal-access-vault-registry-77ea",
      evidence: "Vault SoR before RightsOS; PersonalVault clash",
      humanOwner: "privacy_reviewer",
      rollback: "Revert #281 vault tables",
    },
    {
      stepOrder: 6,
      action: "rebase_strip_vault_then_merge",
      prNumber: 280,
      branchName: "cursor/rightsos-purpose-registry-shadow-aa10",
      evidence:
        "RightsOS must drop duplicate vault models and depend on Vault #281; rebase preserving indoor",
      humanOwner: "privacy_reviewer",
      rollback: "Revert #280",
    },
    {
      stepOrder: 7,
      action: "renumber_migrations",
      prNumber: 281,
      evidence:
        "Vault / A11yOps / Transport MVP cannot share 20260716140000 — renumber before merge of #282/#283",
      humanOwner: "database_reviewer",
      rollback: "Keep unique timestamps on surviving branches",
    },
    {
      stepOrder: 8,
      action: "merge",
      prNumber: 284,
      branchName: "cursor/civic-asset-registry-static-projection-585f",
      evidence: "Civic asset registry before AccessibilityOps",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #284",
    },
    {
      stepOrder: 9,
      action: "merge",
      prNumber: 282,
      branchName: "cursor/accessibility-ops-asset-registry-4343",
      evidence: "AccessibilityOps after Civic with AccessPlace FK rules; renumbered migration",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #282",
    },
    {
      stepOrder: 10,
      action: "rebuild_on_main",
      prNumber: 266,
      branchName: "cursor/ai-canonical-place-binding-6ea8",
      evidence:
        "Do not merge CONFLICTING #266/#273 as-is; rebuild Access Intelligence preserving indoor; fold AiAccess* as extensions",
      humanOwner: "architecture_reviewer",
      rollback: "Close superseded AI siblings after rebuild PR",
    },
    {
      stepOrder: 11,
      action: "rebase_stack",
      prNumber: 267,
      branchName: "cursor/mapable-aura-wave1-6ea8",
      evidence:
        "Rebase entire AURA stack #267–#277 onto post-AI main; CareOSMission DDL from CareOS SoR not AURA",
      humanOwner: "architecture_reviewer",
      rollback: "Leave stack unmerged",
    },
    {
      stepOrder: 12,
      action: "merge",
      prNumber: 276,
      branchName: "cursor/transport-production-claims-5a9f",
      evidence: "Prefer Trip production claims; treat #283 as rebuild/adapter candidate",
      humanOwner: "release_manager",
      rollback: "Revert #276",
    },
    {
      stepOrder: 13,
      action: "defer_or_rebuild",
      prNumber: 283,
      branchName: "cursor/mapable-transport-mvp-c42d",
      evidence: "Transport MVP conflicts with TransportTrip canonical — adapter/rebuild only",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 14,
      action: "rebase_extension_only",
      prNumber: 287,
      branchName: "cursor/continuity-os-life-event-registry-9cd2",
      evidence:
        "Continuity: LifeEventMissionExtension only — no second CareOSMission DDL",
      humanOwner: "architecture_reviewer",
      rollback: "Strip CareOSMission from #287 before merge",
    },
    {
      stepOrder: 15,
      action: "rescan_convergence",
      evidence:
        "After each human merge: rebase dependents; rerun tests; POST /api/convergence/scans/repository",
      humanOwner: "release_manager",
      rollback: "Disable MAPABLE_CONVERGENCE_OS_ENABLED",
    },
  ],
};
