import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceRehearsalEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Rehearsal lab | ConvergenceOS" };

export default async function RehearsalPage() {
  if (!isConvergenceRehearsalEnabled()) redirect("/admin");

  const runs = await prisma.rehearsalRun.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ConvergenceShell
      title="Merge / migration rehearsal lab"
      description="Disposable advisory rehearsals with synthetic tenants. mutatesRealBranches is always false — never merges into product branches."
    >
      <ConvergenceActionButton
        label="Run foundation train rehearsal"
        endpoint="/api/convergence/rehearsal"
        doneMessage="Rehearsal complete — no real branches mutated."
      />

      <ConvergenceDataTable
        caption="Rehearsal runs"
        rows={runs}
        columns={[
          {
            key: "key",
            header: "Key",
            cell: (r) => r.rehearsalKey,
          },
          { key: "type", header: "Type", cell: (r) => r.rehearsalType },
          { key: "status", header: "Status", cell: (r) => r.status },
          {
            key: "train",
            header: "Train",
            cell: (r) => r.trainKey ?? "—",
          },
          {
            key: "mutate",
            header: "Mutates real branches",
            cell: (r) => (r.mutatesRealBranches ? "YES (invalid)" : "false"),
          },
          {
            key: "summary",
            header: "Summary",
            cell: (r) => r.summary ?? "—",
          },
        ]}
      />
    </ConvergenceShell>
  );
}
