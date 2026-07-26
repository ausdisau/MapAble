import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function createAssessorCase(params: {
  assessorUserId: string;
  caseType: string;
  referenceCode?: string;
  notes?: string;
}) {
  return prisma.assessorCase.create({
    data: {
      assessorUserId: params.assessorUserId,
      caseType: params.caseType,
      referenceCode: params.referenceCode,
      notes: params.notes,
      status: "open",
    },
  });
}

export async function listAssessorCasesForUser(
  userId: string,
  role: UserRole
) {
  if (!hasPermission(role, "assessor:portal") && role !== "mapable_admin") {
    throw new Error("FORBIDDEN");
  }
  return prisma.assessorCase.findMany({
    where: role === "mapable_admin" ? {} : { assessorUserId: userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function closeAssessorCase(caseId: string) {
  return prisma.assessorCase.update({
    where: { id: caseId },
    data: { status: "closed" },
  });
}
