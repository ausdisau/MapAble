import { prisma } from "@/lib/prisma";

export async function addAssessmentEvidence(params: {
  assessmentId: string;
  storagePath: string;
  caption?: string;
}) {
  return prisma.accessAccreditationEvidence.create({
    data: params,
  });
}
