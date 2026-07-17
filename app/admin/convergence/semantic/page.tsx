import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceSemanticResolverEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Semantic resolver | ConvergenceOS" };

export default async function SemanticPage() {
  if (!isConvergenceSemanticResolverEnabled()) redirect("/admin");

  const candidates = await prisma.semanticOverlapCandidate.findMany({
    orderBy: { candidateKey: "asc" },
  });

  return (
    <ConvergenceShell
      title="Semantic domain resolver"
      description="Overlap candidates from known collisions. Never merge on vector similarity alone. Humans decide canonical meaning."
    >
      <ConvergenceActionButton
        label="Seed semantic candidates"
        endpoint="/api/convergence/semantic"
        body={{ action: "seed" }}
        doneMessage="Candidates seeded — awaiting human decisions."
      />

      <ConvergenceDataTable
        caption="Semantic overlap candidates"
        rows={candidates}
        columns={[
          {
            key: "key",
            header: "Key",
            cell: (c) => c.candidateKey,
          },
          {
            key: "pair",
            header: "Pair",
            cell: (c) => `${c.leftName} ↔ ${c.rightName}`,
          },
          {
            key: "class",
            header: "Classification",
            cell: (c) => c.classification,
          },
          {
            key: "confidence",
            header: "Confidence",
            cell: (c) => c.confidence.toFixed(2),
          },
          {
            key: "diff",
            header: "Unresolved differences",
            cell: (c) => c.unresolvedDifferences ?? "—",
          },
          {
            key: "decision",
            header: "Human decision",
            cell: (c) => c.humanDecision ?? "pending",
          },
        ]}
      />
    </ConvergenceShell>
  );
}
