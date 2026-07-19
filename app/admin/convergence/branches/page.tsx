import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceBranchGraphEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Branches | ConvergenceOS" };

export default async function ConvergenceBranchesPage() {
  if (!isConvergenceBranchGraphEnabled()) redirect("/admin");

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  const branches = latest
    ? await prisma.repositoryBranch.findMany({
        where: { snapshotId: latest.id },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <ConvergenceShell
      title="Branches"
      description="Head branches from the latest repository snapshot, including indoor-drop and schema-change signals."
    >
      <ConvergenceDataTable
        caption="Repository branches"
        rows={branches}
        columns={[
          { key: "name", header: "Branch", cell: (b) => b.name },
          {
            key: "ahead",
            header: "Ahead of main",
            cell: (b) => b.aheadOfMain ?? "—",
          },
          {
            key: "behind",
            header: "Behind main",
            cell: (b) => b.behindMain ?? "—",
          },
          {
            key: "indoor",
            header: "Drops indoor",
            cell: (b) => (b.dropsIndoor ? "yes — rebase required" : "no"),
          },
          {
            key: "schema",
            header: "Schema changed",
            cell: (b) => (b.schemaChanged ? "yes" : "no"),
          },
          { key: "notes", header: "Notes", cell: (b) => b.notes ?? "—" },
        ]}
      />
    </ConvergenceShell>
  );
}
