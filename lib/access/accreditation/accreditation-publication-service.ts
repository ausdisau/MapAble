import { prisma } from "@/lib/prisma";

export async function withdrawAssessment(assessmentId: string) {
  const a = await prisma.accessAccreditationAssessment.update({
    where: { id: assessmentId },
    data: { status: "withdrawn" },
  });
  return a;
}

export async function expireAssessment(assessmentId: string) {
  return prisma.accessAccreditationAssessment.update({
    where: { id: assessmentId },
    data: { status: "expired" },
  });
}
