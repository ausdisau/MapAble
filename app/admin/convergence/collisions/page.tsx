import { redirect } from "next/navigation";

import {
  ConvergenceDataTable,
  RiskBadge,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceSchemaScanEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Collisions | ConvergenceOS" };

export default async function ConvergenceCollisionsPage() {
  if (!isConvergenceSchemaScanEnabled()) redirect("/admin");

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  const collisions = latest
    ? await prisma.migrationCollision.findMany({
        where: { snapshotId: latest.id },
        orderBy: [{ severity: "asc" }, { title: "asc" }],
      })
    : [];

  return (
    <ConvergenceShell
      title="Schema and migration collisions"
      description="Static analysis findings. Recommendations are advisory; humans decide. Related projections (e.g. CivicAsset vs AccessibilityAsset) are labelled separately from true duplicates."
    >
      <ConvergenceDataTable
        caption="Collision findings"
        rows={collisions}
        columns={[
          {
            key: "severity",
            header: "Severity",
            cell: (c) => <RiskBadge risk={c.severity} />,
          },
          { key: "category", header: "Category", cell: (c) => c.category },
          { key: "title", header: "Title", cell: (c) => c.title },
          {
            key: "recommendation",
            header: "Canonical recommendation",
            cell: (c) => c.canonicalRecommendation ?? "—",
          },
          {
            key: "manual",
            header: "Manual decision",
            cell: (c) => (c.manualDecisionRequired ? "required" : "optional"),
          },
        ]}
      />
    </ConvergenceShell>
  );
}
