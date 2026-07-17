import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceLineageEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Lineage | ConvergenceOS" };

export default async function LineagePage() {
  if (!isConvergenceLineageEnabled()) redirect("/admin");

  const [nodes, edges, chains] = await Promise.all([
    prisma.dataLineageNode.findMany({ orderBy: { nodeKey: "asc" } }),
    prisma.dataLineageEdge.findMany({ orderBy: { edgeKey: "asc" } }),
    prisma.authorityChain.findMany({
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { chainKey: "asc" },
    }),
  ]);

  return (
    <ConvergenceShell
      title="Data and authority lineage"
      description="Synthetic Passport doorway sample (C-018). No production participant data. Structured tables are the primary view."
    >
      <ConvergenceActionButton
        label="Seed synthetic Passport doorway lineage"
        endpoint="/api/convergence/lineage"
        doneMessage="Synthetic lineage seeded."
      />

      <ConvergenceDataTable
        caption="Data lineage nodes"
        rows={nodes}
        columns={[
          { key: "nodeKey", header: "Node", cell: (n) => n.nodeKey },
          { key: "label", header: "Label", cell: (n) => n.label },
          { key: "class", header: "Class", cell: (n) => n.dataClass },
          {
            key: "field",
            header: "Field",
            cell: (n) => n.fieldPath ?? "—",
          },
          {
            key: "synthetic",
            header: "Synthetic",
            cell: (n) => (n.synthetic ? "yes" : "no"),
          },
        ]}
      />

      <ConvergenceDataTable
        caption="Data lineage edges"
        rows={edges}
        columns={[
          { key: "from", header: "From", cell: (e) => e.fromNodeKey },
          { key: "to", header: "To", cell: (e) => e.toNodeKey },
          {
            key: "transform",
            header: "Transformation",
            cell: (e) => e.transformation ?? "—",
          },
          {
            key: "policy",
            header: "Policy",
            cell: (e) => e.policyRef ?? "—",
          },
        ]}
      />

      <ConvergenceDataTable
        caption="Authority chains"
        rows={chains}
        columns={[
          { key: "chain", header: "Chain", cell: (c) => c.chainKey },
          { key: "title", header: "Title", cell: (c) => c.title },
          { key: "status", header: "Status", cell: (c) => c.status },
          {
            key: "steps",
            header: "Steps",
            cell: (c) =>
              c.steps.map((s) => `${s.stepOrder}:${s.stepType}`).join(" → "),
          },
        ]}
      />
    </ConvergenceShell>
  );
}
