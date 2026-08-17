import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { requireConvergenceEnabled } from "@/lib/platform/convergence-os/gates";
import { getLatestSnapshotId } from "@/lib/platform/convergence-os/scans/repository-scan";
import { buildConvergenceTextReport } from "@/lib/platform/convergence-os/text-report";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceEnabled();
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const snapshotId =
    searchParams.get("snapshotId") ?? (await getLatestSnapshotId());

  if (!snapshotId) {
    return jsonError("No snapshot available. Run a repository scan first.", 404);
  }

  const snapshot = await prisma.repositorySnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot) return jsonError("Snapshot not found", 404);

  const [domainCount, prCount, dependencyCount, collisions, train] =
    await Promise.all([
      prisma.canonicalDomain.count(),
      prisma.repositoryPullRequest.count({ where: { snapshotId } }),
      prisma.repositoryDependency.count({ where: { snapshotId } }),
      prisma.migrationCollision.findMany({ where: { snapshotId } }),
      prisma.mergeTrain.findFirst({
        where: { snapshotId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const prs = await prisma.repositoryPullRequest.findMany({
    where: { snapshotId },
    select: { warningLabels: true },
  });
  const warningLabels = [
    ...new Set(
      prs.flatMap((p) =>
        Array.isArray(p.warningLabels)
          ? (p.warningLabels as string[])
          : []
      )
    ),
  ];

  const text = buildConvergenceTextReport({
    snapshotId,
    baseCommitSha: snapshot.baseCommitSha,
    scannedAt: snapshot.scannedAt,
    domainCount,
    prCount,
    dependencyCount,
    collisionCount: collisions.length,
    criticalCollisions: collisions
      .filter((c) => c.severity === "critical")
      .map((c) => c.title),
    mergeTrainName: train?.name,
    warningLabels,
  });

  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="convergence-report-${snapshotId}.txt"`,
    },
  });
}
