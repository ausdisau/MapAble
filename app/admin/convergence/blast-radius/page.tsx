import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import {
  ConvergenceDataTable,
  RiskBadge,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceBlastRadiusEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Blast radius | ConvergenceOS" };

export default async function BlastRadiusPage() {
  if (!isConvergenceBlastRadiusEnabled()) redirect("/admin");

  const simulations = await prisma.blastRadiusSimulation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ConvergenceShell
      title="Blast-radius simulator"
      description="Deterministic severity ladder with counterfactuals. AI may explain severity but cannot lower the final rating."
    >
      <ConvergenceActionButton
        label="Seed counterfactual simulations"
        endpoint="/api/convergence/blast-radius"
        body={{ action: "seed_counterfactuals" }}
        doneMessage="Counterfactuals recorded."
      />

      <ConvergenceDataTable
        caption="Simulations"
        rows={simulations}
        columns={[
          {
            key: "key",
            header: "Key",
            cell: (s) => s.simulationKey,
          },
          {
            key: "summary",
            header: "Change",
            cell: (s) => s.changeSummary,
          },
          {
            key: "final",
            header: "Final severity",
            cell: (s) => <RiskBadge risk={s.finalSeverity} />,
          },
          {
            key: "ai",
            header: "AI explained",
            cell: (s) => s.aiExplainedSeverity ?? "—",
          },
          {
            key: "cf",
            header: "Counterfactual",
            cell: (s) => (s.counterfactual ? "yes" : "no"),
          },
          {
            key: "rollback",
            header: "Rollback",
            cell: (s) => s.rollbackDifficulty ?? "—",
          },
        ]}
      />
    </ConvergenceShell>
  );
}
