import { redirect } from "next/navigation";

import {
  ConvergenceDataTable,
  RiskBadge,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceBranchGraphEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pull requests | ConvergenceOS" };

export default async function ConvergencePullRequestsPage() {
  if (!isConvergenceBranchGraphEnabled()) redirect("/admin");

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  const pullRequests = latest
    ? await prisma.repositoryPullRequest.findMany({
        where: { snapshotId: latest.id },
        orderBy: [{ recommendedMergeOrder: "asc" }, { number: "asc" }],
      })
    : [];

  return (
    <ConvergenceShell
      title="Pull requests"
      description="File-verified pilot PR inventory with collision risk and warning labels. Structured list — not a merge bot."
    >
      <ConvergenceDataTable
        caption="ConvergenceOS pull request registry"
        rows={pullRequests}
        columns={[
          {
            key: "number",
            header: "PR",
            cell: (p) =>
              p.url ? (
                <a
                  className="underline underline-offset-2"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  #{p.number}
                </a>
              ) : (
                `#${p.number}`
              ),
          },
          { key: "title", header: "Title", cell: (p) => p.title },
          {
            key: "base",
            header: "Base → head",
            cell: (p) => `${p.baseBranch} → ${p.headBranch}`,
          },
          {
            key: "risk",
            header: "Collision risk",
            cell: (p) => <RiskBadge risk={p.collisionRisk} />,
          },
          {
            key: "order",
            header: "Suggested order",
            cell: (p) => p.recommendedMergeOrder ?? "—",
          },
          {
            key: "warnings",
            header: "Warning labels",
            cell: (p) =>
              Array.isArray(p.warningLabels)
                ? (p.warningLabels as string[]).join(", ") || "—"
                : "—",
          },
          {
            key: "indoor",
            header: "Behind / indoor",
            cell: (p) => {
              const labels = Array.isArray(p.warningLabels)
                ? (p.warningLabels as string[])
                : [];
              const stale = labels.some((l) =>
                l.includes("indoor") || l.includes("stale")
              );
              return stale ? "Needs rebase (indoor)" : "ok / unknown";
            },
          },
        ]}
      />
    </ConvergenceShell>
  );
}
