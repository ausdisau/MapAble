import { createHash } from "crypto";

import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assertNoAutoMutation } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";
import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
import { CANONICAL_DOMAIN_SEEDS } from "@/lib/convergence-os/seed/canonical-domains";
import { DECISION_PROPOSAL_SEEDS } from "@/lib/convergence-os/seed/decisions";
import {
  PILOT_DEPENDENCY_SEEDS,
  PILOT_PR_SEEDS,
} from "@/lib/convergence-os/seed/pilot-prs";
import {
  analyseSchemaCollisions,
  SCHEMA_REF_FIXTURES,
} from "@/lib/convergence-os/schema/collision-engine";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";
import { buildConvergenceTextReport } from "@/lib/convergence-os/text-report";

export type RepositoryScanResult = {
  snapshotId: string;
  baseCommitSha: string;
  domainCount: number;
  capabilityCount: number;
  branchCount: number;
  prCount: number;
  dependencyCount: number;
  collisionCount: number;
  mergeTrainId: string | null;
  decisionProposalCount: number;
  textReport: string;
};

function contentHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Wave 0 repository scan: persist verified pilot inventory, collisions, and
 * advisory merge train. Does not mutate git, flags, or product schemas.
 */
export async function runRepositoryScan(options?: {
  actorUserId?: string | null;
  actorRole?: string | null;
  baseCommitSha?: string;
  includeSchemaScan?: boolean;
  includeMergeTrain?: boolean;
}): Promise<RepositoryScanResult> {
  assertNoAutoMutation();

  const baseCommitSha =
    options?.baseCommitSha ??
    process.env.MAPABLE_CONVERGENCE_BASE_COMMIT ??
    "eb52b9f0b6589e0ca1c813e46c012e71e3b2a0ee";

  const includeSchemaScan = options?.includeSchemaScan !== false;
  const includeMergeTrain = options?.includeMergeTrain !== false;

  const collisions = includeSchemaScan ? analyseSchemaCollisions() : [];
  const hash = contentHash({
    baseCommitSha,
    domains: CANONICAL_DOMAIN_SEEDS.map((d) => d.domainKey),
    prs: PILOT_PR_SEEDS.map((p) => p.number),
    deps: PILOT_DEPENDENCY_SEEDS,
    collisions: collisions.map((c) => c.collisionKey),
  });

  const snapshot = await prisma.repositorySnapshot.create({
    data: {
      baseBranch: "main",
      baseCommitSha,
      source: "fixture_pilot",
      contentHash: hash,
      summaryJson: {
        pilotPrCount: PILOT_PR_SEEDS.length,
        domainCount: CANONICAL_DOMAIN_SEEDS.length,
        collisionCount: collisions.length,
        note: "File-verified pilot inventory; not live GitHub metadata alone",
      },
    },
  });

  // Domains (upsert global registry)
  for (const seed of CANONICAL_DOMAIN_SEEDS) {
    const domain = await prisma.canonicalDomain.upsert({
      where: { domainKey: seed.domainKey },
      create: {
        domainKey: seed.domainKey,
        name: seed.name,
        purpose: seed.purpose,
        canonicalModel: seed.canonicalModel,
        canonicalService: seed.canonicalService,
        canonicalApi: seed.canonicalApi,
        canonicalEventOwner: seed.canonicalEventOwner,
        owningProgramme: seed.owningProgramme,
        authoritativePath: seed.authoritativePath,
        status: seed.status,
        compatibilityAliases: seed.compatibilityAliases ?? undefined,
        duplicateImplementations: seed.duplicateImplementations ?? undefined,
        migrationState: seed.migrationState,
        deprecationState: seed.deprecationState,
        notes: seed.notes,
      },
      update: {
        name: seed.name,
        purpose: seed.purpose,
        canonicalModel: seed.canonicalModel,
        canonicalService: seed.canonicalService,
        canonicalApi: seed.canonicalApi,
        owningProgramme: seed.owningProgramme,
        authoritativePath: seed.authoritativePath,
        status: seed.status,
        compatibilityAliases: seed.compatibilityAliases ?? undefined,
        duplicateImplementations: seed.duplicateImplementations ?? undefined,
        migrationState: seed.migrationState,
        deprecationState: seed.deprecationState,
        notes: seed.notes,
      },
    });

    const versionCount = await prisma.canonicalDomainVersion.count({
      where: { domainId: domain.id },
    });
    await prisma.canonicalDomainVersion.create({
      data: {
        domainId: domain.id,
        version: versionCount + 1,
        status: seed.status,
        canonicalModel: seed.canonicalModel,
        changeSummary: `Snapshot ${snapshot.id}`,
        evidenceJson: { snapshotId: snapshot.id, authoritativePath: seed.authoritativePath },
      },
    });
  }

  // Capabilities
  for (const seed of CAPABILITY_SEEDS) {
    await prisma.platformCapability.upsert({
      where: { capabilityKey: seed.capabilityKey },
      create: {
        capabilityKey: seed.capabilityKey,
        name: seed.name,
        programme: seed.programme,
        userValue: seed.userValue,
        canonicalOwner: seed.canonicalOwner,
        implementationPaths: seed.implementationPaths ?? undefined,
        authorityLevel: seed.authorityLevel,
        readWrite: seed.readWrite,
        externalSideEffects: seed.externalSideEffects ?? false,
        participantApprovalRequired: seed.participantApprovalRequired ?? false,
        featureFlags: seed.featureFlags ?? undefined,
        dataDomains: seed.dataDomains ?? undefined,
        maturity: seed.maturity,
        persistenceType: seed.persistenceType,
        runtimeMode: seed.runtimeMode,
        productionClaimStatus: seed.productionClaimStatus,
        rollbackNotes: seed.rollbackNotes,
        owner: seed.owner,
        honestyJson: seed.honesty,
      },
      update: {
        name: seed.name,
        programme: seed.programme,
        maturity: seed.maturity,
        persistenceType: seed.persistenceType,
        runtimeMode: seed.runtimeMode,
        productionClaimStatus: seed.productionClaimStatus,
        honestyJson: seed.honesty,
        implementationPaths: seed.implementationPaths ?? undefined,
        featureFlags: seed.featureFlags ?? undefined,
      },
    });
  }

  // Decision proposals (do not auto-approve)
  let decisionProposalCount = 0;
  for (const seed of DECISION_PROPOSAL_SEEDS) {
    await prisma.architectureDecision.upsert({
      where: { decisionKey: seed.decisionKey },
      create: {
        decisionKey: seed.decisionKey,
        title: seed.title,
        decisionType: seed.decisionType,
        context: seed.context,
        alternativesJson: seed.alternatives,
        selectedOption: seed.selectedOption,
        rationale: seed.rationale,
        affectedPrs: seed.affectedPrs,
        status: "proposal",
        isAiProposal: seed.isAiProposal,
        owner: seed.owner,
      },
      update: {
        title: seed.title,
        context: seed.context,
        alternativesJson: seed.alternatives,
        selectedOption: seed.selectedOption,
        rationale: seed.rationale,
        affectedPrs: seed.affectedPrs,
        // Never flip approved status from a scan
      },
    });
    decisionProposalCount += 1;
  }

  // Branches + PRs
  const branchIdByName = new Map<string, string>();
  for (const pr of PILOT_PR_SEEDS) {
    if (branchIdByName.has(pr.headBranch)) continue;
    const branch = await prisma.repositoryBranch.create({
      data: {
        snapshotId: snapshot.id,
        name: pr.headBranch,
        aheadOfMain: pr.aheadOfMain ?? null,
        behindMain: pr.behindMain ?? null,
        dropsIndoor: pr.dropsIndoor ?? false,
        schemaChanged: pr.schemaChanged ?? false,
        notes: pr.warningLabels?.join(", "),
        metadataJson: { classLabel: pr.classLabel, collisionRisk: pr.collisionRisk },
      },
    });
    branchIdByName.set(pr.headBranch, branch.id);
  }

  const prIdByNumber = new Map<number, string>();
  for (const pr of PILOT_PR_SEEDS) {
    const row = await prisma.repositoryPullRequest.create({
      data: {
        snapshotId: snapshot.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        isDraft: pr.isDraft,
        baseBranch: pr.baseBranch,
        headBranch: pr.headBranch,
        headBranchId: branchIdByName.get(pr.headBranch) ?? null,
        mergeable: pr.mergeable,
        changedFiles: pr.changedFiles,
        additions: pr.additions,
        deletions: pr.deletions,
        url: pr.url,
        classLabel: pr.classLabel,
        collisionRisk: pr.collisionRisk,
        domainsAffected: pr.domainsAffected ?? undefined,
        prismaModelsAdded: pr.prismaModelsAdded ?? undefined,
        migrationsAdded: pr.migrationsAdded ?? undefined,
        featureFlagsAdded: pr.featureFlagsAdded ?? undefined,
        knownLimitations: pr.knownLimitations,
        explicitNonGoals: pr.explicitNonGoals,
        recommendedMergeOrder: pr.recommendedMergeOrder,
        warningLabels: pr.warningLabels ?? undefined,
      },
    });
    prIdByNumber.set(pr.number, row.id);
  }

  for (const dep of PILOT_DEPENDENCY_SEEDS) {
    await prisma.repositoryDependency.create({
      data: {
        snapshotId: snapshot.id,
        edgeType: dep.edgeType,
        fromPrId: prIdByNumber.get(dep.fromPr) ?? null,
        toPrId: prIdByNumber.get(dep.toPr) ?? null,
        fromRef: `PR#${dep.fromPr}`,
        toRef: `PR#${dep.toPr}`,
        evidence: dep.evidence,
      },
    });
  }

  // Schema snapshots + collisions
  if (includeSchemaScan) {
    for (const ref of SCHEMA_REF_FIXTURES) {
      await prisma.schemaSnapshot.create({
        data: {
          snapshotId: snapshot.id,
          refLabel: ref.refLabel,
          refName: ref.refName,
          modelCount: ref.modelNames.length,
          modelNamesJson: ref.modelNames,
          migrationDirsJson: ref.migrationDirs,
          contentHash: contentHash(ref),
        },
      });
    }
    for (const c of collisions) {
      await prisma.migrationCollision.create({
        data: {
          snapshotId: snapshot.id,
          collisionKey: c.collisionKey,
          severity: c.severity,
          category: c.category,
          title: c.title,
          affectedModels: c.affectedModels ?? undefined,
          affectedBranches: c.affectedBranches ?? undefined,
          exactDifference: c.exactDifference,
          semanticInterpretation: c.semanticInterpretation,
          canonicalRecommendation: c.canonicalRecommendation,
          migrationStrategy: c.migrationStrategy,
          dataPreservationRisk: c.dataPreservationRisk,
          rollbackNotes: c.rollbackNotes,
          manualDecisionRequired: c.manualDecisionRequired,
          evidenceJson: (c.evidenceJson as Prisma.InputJsonValue) ?? undefined,
        },
      });
    }
  }

  let mergeTrainId: string | null = null;
  if (includeMergeTrain) {
    const train = await prisma.mergeTrain.create({
      data: {
        snapshotId: snapshot.id,
        trainKey: FOUNDATION_MERGE_TRAIN.trainKey,
        name: FOUNDATION_MERGE_TRAIN.name,
        trainType: FOUNDATION_MERGE_TRAIN.trainType,
        status: "proposed",
        summary: FOUNDATION_MERGE_TRAIN.summary,
        riskSummary: FOUNDATION_MERGE_TRAIN.riskSummary,
        rollbackNotes: FOUNDATION_MERGE_TRAIN.rollbackNotes,
        steps: {
          create: FOUNDATION_MERGE_TRAIN.steps.map((s) => ({
            stepOrder: s.stepOrder,
            action: s.action,
            prNumber: s.prNumber,
            branchName: s.branchName,
            evidence: s.evidence,
            humanOwner: s.humanOwner,
            rollback: s.rollback,
          })),
        },
      },
    });
    mergeTrainId = train.id;
  }

  const warningLabels = [
    ...new Set(PILOT_PR_SEEDS.flatMap((p) => p.warningLabels ?? [])),
  ];
  const criticalCollisions = collisions
    .filter((c) => c.severity === "critical")
    .map((c) => c.title);

  const textReport = buildConvergenceTextReport({
    snapshotId: snapshot.id,
    baseCommitSha,
    scannedAt: snapshot.scannedAt,
    domainCount: CANONICAL_DOMAIN_SEEDS.length,
    prCount: PILOT_PR_SEEDS.length,
    dependencyCount: PILOT_DEPENDENCY_SEEDS.length,
    collisionCount: collisions.length,
    criticalCollisions,
    mergeTrainName: includeMergeTrain ? FOUNDATION_MERGE_TRAIN.name : undefined,
    warningLabels,
  });

  await createAuditEvent({
    actorUserId: options?.actorUserId,
    actorRole: options?.actorRole as never,
    action: "convergence.scan_completed",
    entityType: "RepositorySnapshot",
    entityId: snapshot.id,
    metadata: {
      source: "fixture_pilot",
      prCount: PILOT_PR_SEEDS.length,
      collisionCount: collisions.length,
      mergeTrainId,
      autoMerge: false,
    },
  });

  return {
    snapshotId: snapshot.id,
    baseCommitSha,
    domainCount: CANONICAL_DOMAIN_SEEDS.length,
    capabilityCount: CAPABILITY_SEEDS.length,
    branchCount: branchIdByName.size,
    prCount: PILOT_PR_SEEDS.length,
    dependencyCount: PILOT_DEPENDENCY_SEEDS.length,
    collisionCount: collisions.length,
    mergeTrainId,
    decisionProposalCount,
    textReport,
  };
}

export async function getLatestSnapshotId(): Promise<string | null> {
  const latest = await prisma.repositorySnapshot.findFirst({
    orderBy: { scannedAt: "desc" },
    select: { id: true },
  });
  return latest?.id ?? null;
}
