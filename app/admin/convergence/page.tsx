import Link from "next/link";
import { redirect } from "next/navigation";

import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { RunScanButton } from "@/components/admin/convergence/RunScanButton";
import { isConvergenceOsEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "ConvergenceOS | Admin" };

export default async function ConvergenceOverviewPage() {
  if (!isConvergenceOsEnabled()) {
    redirect("/admin");
  }

  const [domains, snapshots, collisions, trains] = await Promise.all([
    prisma.canonicalDomain.count(),
    prisma.repositorySnapshot.count(),
    prisma.migrationCollision.count(),
    prisma.mergeTrain.count(),
  ]);

  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
  });

  return (
    <ConvergenceShell
      title="ConvergenceOS"
      description="Platform governance control plane: Wave 0 registries plus Iteration 2 twin, constitution, lineage, blast-radius, rehearsal, and agent preflight — all advisory. Cursor may propose; humans approve; GitHub executes."
    >
      <section
        aria-labelledby="conv-status"
        className="space-y-3 rounded-md border border-border p-4"
      >
        <h2 id="conv-status" className="text-lg font-semibold">
          Status
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Mode: audit / advisory (auto-merge permanently disabled)</li>
          <li>Canonical domains registered: {domains}</li>
          <li>Repository snapshots: {snapshots}</li>
          <li>Collision findings stored: {collisions}</li>
          <li>Merge trains proposed: {trains}</li>
          <li>
            Latest snapshot:{" "}
            {latest
              ? `${latest.id} @ ${latest.baseCommitSha.slice(0, 8)} (${latest.scannedAt.toISOString()})`
              : "none — run a scan"}
          </li>
        </ul>
        <RunScanButton />
        <p className="text-sm text-muted-foreground">
          Iteration 2: enable twin/constitution/… flags, then use{" "}
          <Link className="underline underline-offset-2" href="/admin/convergence/ops">
            Ops / federation
          </Link>{" "}
          to seed registries, or open Twin / Constitution / Lineage sections.
        </p>
        {latest ? (
          <p className="text-sm">
            <Link
              className="underline underline-offset-2"
              href={`/api/convergence/report?snapshotId=${latest.id}`}
            >
              Download plain-text report
            </Link>
          </p>
        ) : null}
      </section>
    </ConvergenceShell>
  );
}
