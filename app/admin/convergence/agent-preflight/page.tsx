import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceAgentPreflightEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Agent preflight | ConvergenceOS" };

export default async function AgentPreflightPage() {
  if (!isConvergenceAgentPreflightEnabled()) redirect("/admin");

  const contracts = await prisma.agentImplementationContract.findMany({
    include: { reviews: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ConvergenceShell
      title="Cursor Agent Preflight Gateway"
      description="Scoped implementation contracts before major agent work. Stop/escalate conditions wire to C-003/C-004/C-005/C-020. Markdown export available via API."
    >
      <ConvergenceDataTable
        caption="Implementation contracts"
        rows={contracts}
        emptyMessage="No contracts yet — POST /api/convergence/agent-preflight or seed Iteration 2."
        columns={[
          {
            key: "key",
            header: "Key",
            cell: (c) => c.contractKey,
          },
          { key: "status", header: "Status", cell: (c) => c.status },
          {
            key: "objective",
            header: "Objective",
            cell: (c) => c.objective,
          },
          {
            key: "ceiling",
            header: "Authority ceiling",
            cell: (c) => c.authorityCeiling ?? "—",
          },
          {
            key: "migrations",
            header: "Migrations",
            cell: (c) => (c.migrationsPermitted ? "permitted*" : "no"),
          },
          {
            key: "reviews",
            header: "Reviews",
            cell: (c) =>
              c.reviews.length
                ? c.reviews.map((r) => r.classification).join(", ")
                : "—",
          },
        ]}
      />
    </ConvergenceShell>
  );
}
