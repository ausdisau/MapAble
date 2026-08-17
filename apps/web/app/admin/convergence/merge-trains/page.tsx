import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceMergeTrainEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Merge trains | ConvergenceOS" };

export default async function ConvergenceMergeTrainsPage() {
  if (!isConvergenceMergeTrainEnabled()) redirect("/admin");

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  const trains = latest
    ? await prisma.mergeTrain.findMany({
        where: { snapshotId: latest.id },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const steps = trains.flatMap((t) =>
    t.steps.map((s) => ({
      id: s.id,
      trainName: t.name,
      stepOrder: s.stepOrder,
      action: s.action,
      prNumber: s.prNumber,
      branchName: s.branchName,
      evidence: s.evidence,
      humanOwner: s.humanOwner,
      rollback: s.rollback,
    }))
  );

  return (
    <ConvergenceShell
      title="Merge trains"
      description="Advisory recommendations only. ConvergenceOS never merges pull requests, executes migrations, or changes feature flags."
    >
      {trains.map((t) => (
        <section
          key={t.id}
          aria-labelledby={`train-${t.id}`}
          className="space-y-2 rounded-md border border-border p-4"
        >
          <h2 id={`train-${t.id}`} className="text-lg font-semibold">
            {t.name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({t.status} · {t.trainType})
            </span>
          </h2>
          <p className="text-sm">{t.summary}</p>
          <p className="text-sm text-muted-foreground">
            Risk: {t.riskSummary}
          </p>
          <p className="text-sm text-muted-foreground">
            Rollback: {t.rollbackNotes}
          </p>
        </section>
      ))}

      <ConvergenceDataTable
        caption="Merge train steps"
        rows={steps}
        emptyMessage="No merge train. Enable merge-train flag and run a repository scan."
        columns={[
          { key: "order", header: "Step", cell: (s) => s.stepOrder },
          { key: "action", header: "Action", cell: (s) => s.action },
          {
            key: "pr",
            header: "PR",
            cell: (s) => (s.prNumber != null ? `#${s.prNumber}` : "—"),
          },
          { key: "branch", header: "Branch", cell: (s) => s.branchName ?? "—" },
          { key: "owner", header: "Human owner", cell: (s) => s.humanOwner ?? "—" },
          { key: "evidence", header: "Evidence", cell: (s) => s.evidence ?? "—" },
        ]}
      />
    </ConvergenceShell>
  );
}
