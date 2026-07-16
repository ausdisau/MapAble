import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceBranchGraphEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dependencies | ConvergenceOS" };

export default async function ConvergenceDependenciesPage() {
  if (!isConvergenceBranchGraphEnabled()) redirect("/admin");

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  const dependencies = latest
    ? await prisma.repositoryDependency.findMany({
        where: { snapshotId: latest.id },
        orderBy: { edgeType: "asc" },
        include: {
          fromPr: { select: { number: true, title: true } },
          toPr: { select: { number: true, title: true } },
        },
      })
    : [];

  return (
    <ConvergenceShell
      title="Dependencies"
      description="Accessible structured list of PR dependency edges (based_on, conflicts_with, should_merge_before, etc.). A visual graph is not required."
    >
      <ConvergenceDataTable
        caption="PR dependency edges"
        rows={dependencies}
        columns={[
          { key: "type", header: "Edge type", cell: (d) => d.edgeType },
          {
            key: "from",
            header: "From",
            cell: (d) =>
              d.fromPr ? `#${d.fromPr.number} ${d.fromPr.title}` : d.fromRef ?? "—",
          },
          {
            key: "to",
            header: "To",
            cell: (d) =>
              d.toPr ? `#${d.toPr.number} ${d.toPr.title}` : d.toRef ?? "—",
          },
          { key: "evidence", header: "Evidence", cell: (d) => d.evidence ?? "—" },
        ]}
      />
    </ConvergenceShell>
  );
}
