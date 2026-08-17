import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assertNoAutoMutation } from "@/lib/config/convergence-os";
import { getLatestSnapshotId } from "@/lib/platform/convergence-os/scans/repository-scan";
import { buildTwinInventory } from "@/lib/platform/convergence-os/twin/inventory";
import { prisma } from "@/lib/prisma";

export type TwinScanResult = {
  snapshotId: string;
  packageCount: number;
  moduleCount: number;
  routeCount: number;
  flagCount: number;
  edgeCount: number;
  hashes: {
    schemaHash: string | null;
    packageGraphHash: string;
    routeGraphHash: string;
    flagManifestHash: string;
    capabilityManifestHash: string;
  };
};

/**
 * Repository Digital Twin foundation scan.
 * Read-only inventory of packages, modules, routes, flags — no GitHub writes.
 */
export async function runTwinScan(options?: {
  actorUserId?: string | null;
  actorRole?: string | null;
  snapshotId?: string | null;
}): Promise<TwinScanResult> {
  assertNoAutoMutation();

  const inventory = buildTwinInventory();
  let snapshotId = options?.snapshotId ?? (await getLatestSnapshotId());

  if (!snapshotId) {
    const snap = await prisma.repositorySnapshot.create({
      data: {
        baseBranch: "main",
        baseCommitSha:
          process.env.MAPABLE_CONVERGENCE_BASE_COMMIT ??
          "eb52b9f0b6589e0ca1c813e46c012e71e3b2a0ee",
        source: "twin_scan",
        snapshotKind: "main",
        contentHash: inventory.hashes.packageGraphHash,
        schemaHash: inventory.hashes.schemaHash,
        packageGraphHash: inventory.hashes.packageGraphHash,
        routeGraphHash: inventory.hashes.routeGraphHash,
        flagManifestHash: inventory.hashes.flagManifestHash,
        capabilityManifestHash: inventory.hashes.capabilityManifestHash,
        summaryJson: {
          twin: true,
          packageCount: inventory.packages.length,
          moduleCount: inventory.modules.length,
          routeCount: inventory.routes.length,
        },
      },
    });
    snapshotId = snap.id;
  } else {
    await prisma.repositorySnapshot.update({
      where: { id: snapshotId },
      data: {
        schemaHash: inventory.hashes.schemaHash,
        packageGraphHash: inventory.hashes.packageGraphHash,
        routeGraphHash: inventory.hashes.routeGraphHash,
        flagManifestHash: inventory.hashes.flagManifestHash,
        capabilityManifestHash: inventory.hashes.capabilityManifestHash,
      },
    });
    await prisma.twinPackage.deleteMany({ where: { snapshotId } });
    await prisma.twinModule.deleteMany({ where: { snapshotId } });
    await prisma.twinRoute.deleteMany({ where: { snapshotId } });
    await prisma.featureFlagManifestEntry.deleteMany({ where: { snapshotId } });
    await prisma.repositoryGraphEdge.deleteMany({ where: { snapshotId } });
  }

  await prisma.twinPackage.createMany({
    data: inventory.packages.map((p) => ({
      snapshotId: snapshotId!,
      name: p.name,
      version: p.version,
      path: p.path,
      kind: p.kind,
    })),
  });

  await prisma.twinModule.createMany({
    data: inventory.modules.map((m) => ({
      snapshotId: snapshotId!,
      moduleKey: m.moduleKey,
      path: m.path,
      programme: m.programme,
      canonicalDomainKeys: m.canonicalDomainKeys,
      description: m.description,
      writerCount: m.writerCount,
      routeCount: m.routeCount,
    })),
  });

  // Batch routes to avoid huge payloads
  const routeChunks = chunk(inventory.routes, 100);
  for (const batch of routeChunks) {
    await prisma.twinRoute.createMany({
      data: batch.map((r) => ({
        snapshotId: snapshotId!,
        method: r.method,
        path: r.path,
        filePath: r.filePath,
        moduleKey: r.moduleKey,
        sideEffects: r.sideEffects,
      })),
    });
  }

  await prisma.featureFlagManifestEntry.createMany({
    data: inventory.flags.map((f) => ({
      snapshotId: snapshotId!,
      flagName: f.flagName,
      defaultValue: f.defaultValue,
      owner: f.owner,
      purpose: f.purpose,
      sourceFile: f.sourceFile,
      category: f.category,
    })),
  });

  await prisma.repositoryGraphEdge.createMany({
    data: inventory.graphEdges.map((e) => ({
      snapshotId: snapshotId!,
      edgeType: e.edgeType,
      fromNodeType: e.fromNodeType,
      fromNodeKey: e.fromNodeKey,
      toNodeType: e.toNodeType,
      toNodeKey: e.toNodeKey,
      evidence: e.evidence,
    })),
  });

  await createAuditEvent({
    actorUserId: options?.actorUserId,
    actorRole: options?.actorRole as never,
    action: "convergence.twin_scan_completed",
    entityType: "RepositorySnapshot",
    entityId: snapshotId,
    metadata: {
      packageCount: inventory.packages.length,
      moduleCount: inventory.modules.length,
      routeCount: inventory.routes.length,
      flagCount: inventory.flags.length,
      autoMerge: false,
    },
  });

  return {
    snapshotId,
    packageCount: inventory.packages.length,
    moduleCount: inventory.modules.length,
    routeCount: inventory.routes.length,
    flagCount: inventory.flags.length,
    edgeCount: inventory.graphEdges.length,
    hashes: inventory.hashes,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
