import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceOsEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Decisions | ConvergenceOS" };

export default async function ConvergenceDecisionsPage() {
  if (!isConvergenceOsEnabled()) redirect("/admin");

  const decisions = await prisma.architectureDecision.findMany({
    orderBy: { decisionKey: "asc" },
  });

  return (
    <ConvergenceShell
      title="Architecture decision ledger"
      description="AI-generated recommendations are labelled as proposals. Only authorised humans can approve canonical decisions (approval workflow lands in a later wave)."
    >
      <ConvergenceDataTable
        caption="Architecture decisions"
        rows={decisions}
        columns={[
          { key: "key", header: "ID", cell: (d) => d.decisionKey },
          { key: "title", header: "Title", cell: (d) => d.title },
          { key: "type", header: "Type", cell: (d) => d.decisionType },
          { key: "status", header: "Status", cell: (d) => d.status },
          {
            key: "ai",
            header: "AI proposal",
            cell: (d) => (d.isAiProposal ? "yes — not authority" : "no"),
          },
          {
            key: "selected",
            header: "Selected option",
            cell: (d) => d.selectedOption ?? "—",
          },
          { key: "owner", header: "Owner", cell: (d) => d.owner ?? "—" },
        ]}
      />
    </ConvergenceShell>
  );
}
