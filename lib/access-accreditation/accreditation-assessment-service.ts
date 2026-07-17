import type { AccessAccreditationLevel } from "@prisma/client";

import { ACCREDITATION_CRITERIA } from "@/lib/access-accreditation/accreditation-criteria-service";
import {
  calculateAccreditationTotal,
  tierFromTotalScore,
  weightedScoreForLevel,
} from "@/lib/access-accreditation/accreditation-scoring-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createAssessment(params: {
  placeId: string;
  assessorId: string;
}) {
  const assessment = await prisma.accessAccreditationAssessment.create({
    data: {
      placeId: params.placeId,
      assessorId: params.assessorId,
      status: "draft",
    },
  });

  await prisma.accessAccreditationScore.createMany({
    data: ACCREDITATION_CRITERIA.map((c) => ({
      assessmentId: assessment.id,
      criterionCode: c.code,
      level: "not_applicable" as AccessAccreditationLevel,
      weightedScore: 0,
    })),
  });

  return assessment;
}

export async function scoreAssessment(
  assessmentId: string,
  scores: { criterionCode: string; level: AccessAccreditationLevel; notes?: string }[]
) {
  for (const row of scores) {
    const def = ACCREDITATION_CRITERIA.find((c) => c.code === row.criterionCode);
    const weight = def?.weight ?? 0;
    await prisma.accessAccreditationScore.updateMany({
      where: { assessmentId, criterionCode: row.criterionCode },
      data: {
        level: row.level,
        weightedScore: weightedScoreForLevel(row.level, weight),
        notes: row.notes,
      },
    });
  }

  const allScores = await prisma.accessAccreditationScore.findMany({
    where: { assessmentId },
    select: { criterionCode: true, level: true },
  });
  const total = calculateAccreditationTotal(allScores);
  const tier = tierFromTotalScore(total);

  return prisma.accessAccreditationAssessment.update({
    where: { id: assessmentId },
    data: { status: "scored", totalScore: total, tier },
  });
}

export async function publishAssessment(assessmentId: string, actorId: string) {
  const assessment = await prisma.accessAccreditationAssessment.update({
    where: { id: assessmentId },
    data: {
      status: "published",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.accessPlace.update({
    where: { id: assessment.placeId },
    data: { confidence: "mapable_accredited" },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "access_accreditation.published",
    entityType: "AccessAccreditationAssessment",
    entityId: assessmentId,
  });

  return assessment;
}

export async function getPublishedAssessmentForPlace(placeId: string) {
  return prisma.accessAccreditationAssessment.findFirst({
    where: {
      placeId,
      status: "published",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { scores: true },
    orderBy: { publishedAt: "desc" },
  });
}

/** Latest published assessment for profile UI, including expired (for renewal messaging). */
export async function getAccreditationDisplayForPlace(placeId: string) {
  const assessment = await prisma.accessAccreditationAssessment.findFirst({
    where: { placeId, status: "published" },
    include: { scores: true },
    orderBy: { publishedAt: "desc" },
  });
  if (!assessment) return null;
  const expired =
    assessment.expiresAt != null &&
    assessment.expiresAt.getTime() <= Date.now();
  return { assessment, expired };
}
