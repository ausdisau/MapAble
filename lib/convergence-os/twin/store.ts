import { runTwinScan } from "@/lib/convergence-os/scans/twin-scan";
import { buildTwinInventory } from "@/lib/convergence-os/twin/inventory";
import { prisma } from "@/lib/prisma";

export type TwinOverview = {
  snapshotId: string | null;
  snapshotKind: string | null;
  baseCommitSha: string | null;
  scannedAt: Date | null;
  hashes: {
    schemaHash: string | null;
    packageGraphHash: string | null;
    routeGraphHash: string | null;
    flagManifestHash: string | null;
    capabilityManifestHash: string | null;
  };
  counts: {
    packages: number;
    modules: number;
    routes: number;
    flags: number;
    edges: number;
  };
  inventoryPreview: ReturnType<typeof buildTwinInventory>;
};

export async function getTwinOverview(
  snapshotId?: string | null
): Promise<TwinOverview> {
  const inventoryPreview = buildTwinInventory();
  const snapshot = snapshotId
    ? await prisma.repositorySnapshot.findUnique({ where: { id: snapshotId } })
    : await prisma.repositorySnapshot.findFirst({
        where: {
          OR: [
            { snapshotKind: "main" },
            { source: "twin_scan" },
            { packageGraphHash: { not: null } },
          ],
        },
        orderBy: { scannedAt: "desc" },
      });

  if (!snapshot) {
    return {
      snapshotId: null,
      snapshotKind: null,
      baseCommitSha: null,
      scannedAt: null,
      hashes: inventoryPreview.hashes,
      counts: {
        packages: inventoryPreview.packages.length,
        modules: inventoryPreview.modules.length,
        routes: inventoryPreview.routes.length,
        flags: inventoryPreview.flags.length,
        edges: inventoryPreview.graphEdges.length,
      },
      inventoryPreview,
    };
  }

  const [packages, modules, routes, flags, edges] = await Promise.all([
    prisma.twinPackage.count({ where: { snapshotId: snapshot.id } }),
    prisma.twinModule.count({ where: { snapshotId: snapshot.id } }),
    prisma.twinRoute.count({ where: { snapshotId: snapshot.id } }),
    prisma.featureFlagManifestEntry.count({
      where: { snapshotId: snapshot.id },
    }),
    prisma.repositoryGraphEdge.count({ where: { snapshotId: snapshot.id } }),
  ]);

  return {
    snapshotId: snapshot.id,
    snapshotKind: snapshot.snapshotKind,
    baseCommitSha: snapshot.baseCommitSha,
    scannedAt: snapshot.scannedAt,
    hashes: {
      schemaHash: snapshot.schemaHash,
      packageGraphHash: snapshot.packageGraphHash,
      routeGraphHash: snapshot.routeGraphHash,
      flagManifestHash: snapshot.flagManifestHash,
      capabilityManifestHash: snapshot.capabilityManifestHash,
    },
    counts: { packages, modules, routes, flags, edges },
    inventoryPreview,
  };
}

export async function compareTwinHashes(
  leftId: string,
  rightId: string
): Promise<{
  left: { id: string; baseCommitSha: string; scannedAt: Date };
  right: { id: string; baseCommitSha: string; scannedAt: Date };
  delta: Record<string, boolean>;
}> {
  const [left, right] = await Promise.all([
    prisma.repositorySnapshot.findUniqueOrThrow({ where: { id: leftId } }),
    prisma.repositorySnapshot.findUniqueOrThrow({ where: { id: rightId } }),
  ]);

  return {
    left: {
      id: left.id,
      baseCommitSha: left.baseCommitSha,
      scannedAt: left.scannedAt,
    },
    right: {
      id: right.id,
      baseCommitSha: right.baseCommitSha,
      scannedAt: right.scannedAt,
    },
    delta: {
      schema: left.schemaHash !== right.schemaHash,
      packages: left.packageGraphHash !== right.packageGraphHash,
      routes: left.routeGraphHash !== right.routeGraphHash,
      flags: left.flagManifestHash !== right.flagManifestHash,
      capabilities: left.capabilityManifestHash !== right.capabilityManifestHash,
    },
  };
}

export { runTwinScan, buildTwinInventory };
