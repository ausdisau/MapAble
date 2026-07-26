import { prisma } from "@/lib/prisma";

const DISCLAIMER =
  "MapAble assessment — not legal certification unless formal external audit is recorded.";

export async function createAccreditationCase(params: {
  entityType: string;
  entityId: string;
  assessmentType?: "mapable_assessment" | "community_review" | "external_audit_placeholder";
}) {
  return prisma.accessibilityAccreditationCase.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      assessmentType: params.assessmentType ?? "mapable_assessment",
      disclaimer: DISCLAIMER,
    },
  });
}

export async function scoreAccreditationCase(
  caseId: string,
  criteria: { criterion: string; score: number; notes?: string }[]
) {
  await prisma.accessibilityAccreditationScore.deleteMany({ where: { caseId } });
  await prisma.accessibilityAccreditationScore.createMany({
    data: criteria.map((c) => ({ caseId, ...c })),
  });
  const avg =
    criteria.reduce((s, c) => s + c.score, 0) / Math.max(criteria.length, 1);
  await prisma.accessibilityAccreditationCase.update({
    where: { id: caseId },
    data: { status: "scored" },
  });
  return { average: avg, disclaimer: DISCLAIMER };
}
