import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureNationalPlatformEnabled,
  nationalPlatformConfig,
} from "@/lib/config/national-platform";
import { prisma } from "@/lib/prisma";
import { getDocumentedTargets } from "@/lib/platform/resilience/procedures";

export async function recordRestoreDrill(input: {
  title: string;
  environment: string;
  outcome: "passed" | "failed" | "partial" | "not_run";
  rpoAchievedMin?: number;
  rtoAchievedMin?: number;
  notes?: string;
  actorUserId: string;
  evidence?: Record<string, unknown>;
}) {
  ensureNationalPlatformEnabled();

  const targets = getDocumentedTargets();
  const record = await prisma.restoreDrillRecord.create({
    data: {
      title: input.title,
      environment: input.environment,
      outcome: input.outcome,
      rpoAchievedMin: input.rpoAchievedMin,
      rtoAchievedMin: input.rtoAchievedMin,
      testedAt: input.outcome !== "not_run" ? new Date() : undefined,
      notes: input.notes,
      conductedById: input.actorUserId,
      evidenceJson: input.evidence
        ? (input.evidence as Prisma.InputJsonValue)
        : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "national_platform.restore_drill_recorded",
    entityType: "RestoreDrillRecord",
    entityId: record.id,
    metadata: {
      outcome: input.outcome,
      documentedRpo: targets.rpoMinutes,
      documentedRto: targets.rtoMinutes,
    },
  });

  return record;
}

export async function listRestoreDrills(limit = 20) {
  if (!nationalPlatformConfig.nationalPlatformEnabled) {
    return { disabled: true as const, records: [] };
  }
  const records = await prisma.restoreDrillRecord.findMany({
    orderBy: { testedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      environment: true,
      outcome: true,
      rpoAchievedMin: true,
      rtoAchievedMin: true,
      testedAt: true,
      notes: true,
      createdAt: true,
    },
  });
  return { disabled: false as const, records };
}

export async function getLatestPassedDrill() {
  return prisma.restoreDrillRecord.findFirst({
    where: { outcome: "passed" },
    orderBy: { testedAt: "desc" },
  });
}
