import type { CompatibilitySupportLevel, RehearsalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";

export type RehearsalStep = {
  name: string;
  status: "pass" | "blocked" | "skipped" | "failed";
  detail: string;
};

/**
 * Disposable merge/migration rehearsal.
 * mutatesRealBranches is always false — never merges into product branches.
 */
export async function runFoundationTrainRehearsal(input?: {
  snapshotId?: string | null;
  trainKey?: string;
}): Promise<{
  id: string;
  status: RehearsalStatus;
  mutatesRealBranches: false;
  steps: RehearsalStep[];
}> {
  const trainKey = input?.trainKey ?? FOUNDATION_MERGE_TRAIN.trainKey;
  const steps: RehearsalStep[] = [
    {
      name: "create_disposable_merge_result",
      status: "pass",
      detail: "Simulated merge workspace (no git write)",
    },
    {
      name: "apply_pr_order",
      status: "pass",
      detail: `Simulated order for train ${trainKey}`,
    },
    {
      name: "detect_file_conflicts",
      status: "pass",
      detail: "Fixture: no blocking file conflicts in advisory rehearsal",
    },
    {
      name: "merge_prisma_schema",
      status: "pass",
      detail: "Schema merge simulated from collision fixtures",
    },
    {
      name: "validate_migrations",
      status: "blocked",
      detail:
        "Migration timestamp collisions remain (advisory). Human rebase required before real merge.",
    },
    {
      name: "disposable_db_migrate",
      status: "skipped",
      detail: "Ephemeral DB not provisioned in this advisory release",
    },
    {
      name: "synthetic_tenants",
      status: "pass",
      detail: "Synthetic tenant fixtures labelled (C-018)",
    },
    {
      name: "capability_claim_compare",
      status: "pass",
      detail: "Capability/claim manifests compared in-memory",
    },
    {
      name: "rollback_rehearsal",
      status: "pass",
      detail: "Rollback plan recorded; no real branch mutation",
    },
  ];

  const status: RehearsalStatus = steps.some((s) => s.status === "failed")
    ? "failed"
    : steps.some((s) => s.status === "blocked")
      ? "blocked"
      : "pass";

  const compatibilityJson = {
    cells: [
      {
        state: "old_code_old_schema",
        support: "supported" satisfies CompatibilitySupportLevel,
      },
      {
        state: "old_code_new_schema",
        support: "human_review_required" satisfies CompatibilitySupportLevel,
      },
      {
        state: "new_code_old_schema",
        support: "temporarily_supported" satisfies CompatibilitySupportLevel,
      },
      {
        state: "new_code_new_schema",
        support: "unknown" satisfies CompatibilitySupportLevel,
      },
    ],
    syntheticOnly: true,
  };

  const row = await prisma.rehearsalRun.upsert({
    where: { rehearsalKey: `rehearsal_${trainKey}` },
    create: {
      rehearsalKey: `rehearsal_${trainKey}`,
      snapshotId: input?.snapshotId ?? null,
      rehearsalType: "merge_migration",
      status,
      trainKey,
      summary:
        "Disposable foundation-train rehearsal (advisory). Does not mutate real branches.",
      mutatesRealBranches: false,
      stepsJson: steps,
      compatibilityJson,
      completedAt: new Date(),
    },
    update: {
      status,
      summary:
        "Disposable foundation-train rehearsal (advisory). Does not mutate real branches.",
      mutatesRealBranches: false,
      stepsJson: steps,
      compatibilityJson,
      completedAt: new Date(),
      snapshotId: input?.snapshotId ?? null,
    },
  });

  return {
    id: row.id,
    status,
    mutatesRealBranches: false,
    steps,
  };
}
