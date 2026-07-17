import type { MergeTrainSeed } from "@/lib/convergence-os/types";

/**
 * MapAble Productisation and Connected Service Programme — advisory merge train.
 * Humans execute in GitHub. ConvergenceOS never auto-merges.
 * Policy: no unmerged stack deeper than 3 PRs.
 */
export const PRODUCTISATION_MERGE_TRAIN: MergeTrainSeed = {
  trainKey: "productisation_connected_service_v1",
  name: "PRODUCTISATION + CONNECTED SERVICE",
  trainType: "PRODUCTISATION",
  summary:
    "Wave 0 reconciliation (#312) → close superseded (incl. AccessCast duplicates after #324) → security (#313) → Communication–Workforce (#314) → split Companion/Ops/Starting Work onto main → Care/Transport/Billing loops → controlled pilot. Max stack depth 3.",
  riskSummary:
    "Critical: dual SoTs (TransportBooking/Trip, Invoice/BillingInvoice); mega RC #323; CareOS parallel writers; encryption fail-open until #313; AI authority creep. No automated merge.",
  rollbackNotes:
    "Revert merge commits in reverse train order; keep product flags off; no participant-data backfill assumed for registry-only Wave 0.",
  steps: [
    {
      stepOrder: 0,
      action: "close_superseded",
      prNumber: 289,
      evidence: "Close #289/#290 — superseded by merged #302",
      humanOwner: "architecture_reviewer",
      rollback: "N/A — close only",
    },
    {
      stepOrder: 1,
      action: "close_superseded",
      prNumber: 320,
      evidence:
        "Close AccessCast duplicates #320/#321/#322/#325 — superseded by merged #324",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 2,
      action: "close_superseded",
      prNumber: 202,
      evidence: "Close #202 Supabase Auth — conflicts with NextAuth ownership",
      humanOwner: "security_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 3,
      action: "close_superseded",
      prNumber: 264,
      evidence: "Close #264/#291/#287/#288 — superseded AI/Vision/Continuity predecessors",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 4,
      action: "split_do_not_merge",
      prNumber: 323,
      evidence:
        "RC1 mega-branch CONFLICTING — split inventories only; never merge as one release",
      humanOwner: "release_manager",
      rollback: "Leave unmerged",
    },
    {
      stepOrder: 5,
      action: "merge_docs_registries",
      prNumber: 312,
      branchName: "cursor/canonical-repo-reconciliation-6ea8",
      evidence:
        "Productisation Wave 0: PR action ledger, public-claim registry, capability honesty, merge train — no product schema",
      humanOwner: "release_manager",
      rollback: "Revert Wave 0 PR",
    },
    {
      stepOrder: 6,
      action: "rebase_then_merge",
      prNumber: 313,
      branchName: "cursor/api-tenant-hardening-6ea8",
      evidence:
        "Security Wave 1: dedicated encryption keys, Zod high-risk routes, org membership, break-glass, IDOR tests",
      humanOwner: "security_reviewer",
      rollback: "Revert hardening PR; fail-closed keys",
    },
    {
      stepOrder: 7,
      action: "rebase_then_merge",
      prNumber: 314,
      branchName: "cursor/comm-workforce-slice-6ea8",
      evidence:
        "Communication Passport → worker acknowledgement → readiness reasons; no auto-assign",
      humanOwner: "product_reviewer",
      rollback: "Feature flag off",
    },
    {
      stepOrder: 8,
      action: "split_onto_main",
      prNumber: 315,
      evidence:
        "Flatten stack: Companion #315, Provider Ops #316, Starting Work #317 rebase onto main after #314 — depth ≤3",
      humanOwner: "architecture_reviewer",
      rollback: "Leave unmerged until split",
    },
    {
      stepOrder: 9,
      action: "defer_archive",
      prNumber: 231,
      evidence: "Archive/defer CareOS parallel platform; no CareOSMission SoT without ADR",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 10,
      action: "rebase_then_merge",
      prNumber: 286,
      evidence: "NDIS Gateway domain only after security; adapters and real NDIA submission remain disabled",
      humanOwner: "database_reviewer",
      rollback: "Revert #286 lib",
    },
    {
      stepOrder: 11,
      action: "consolidate",
      prNumber: 273,
      evidence: "AI Expansion consolidate with AI Next; refuse AiAccessPlace second writer; supersede #266",
      humanOwner: "architecture_reviewer",
      rollback: "Leave unmerged until consolidate PR ready",
    },
    {
      stepOrder: 12,
      action: "retire_after_migration",
      prNumber: 283,
      evidence: "TransportBooking writers → TransportTrip; legacy Invoice → BillingInvoice",
      humanOwner: "database_reviewer",
      rollback: "Dual-read window then disable writers",
    },
    {
      stepOrder: 13,
      action: "controlled_pilot",
      evidence:
        "Starting Work / Taylor @ Harbour Civic Centre — human review throughout; no live NDIA; no AI decisions",
      humanOwner: "pilot_lead",
      rollback: "Suspend pilot flags; Continuity recovery",
    },
    {
      stepOrder: 14,
      action: "rescan_convergence",
      evidence:
        "After each human merge: rebase dependents; rerun remediation CI; refresh PR action ledger",
      humanOwner: "release_manager",
      rollback: "Disable MAPABLE_CONVERGENCE_OS_ENABLED",
    },
  ],
};
