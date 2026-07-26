import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function enrollPartnerApiProgram(
  organisationId: string,
  programTier = "standard"
) {
  if (!phase9Config.publicApiPartnerProgramEnabled) {
    throw new Error("PARTNER_API_PROGRAM_DISABLED");
  }
  return prisma.partnerApiProgramEnrollment.create({
    data: { organisationId, programTier, status: "pending" },
  });
}

export async function approvePartnerEnrollment(
  enrollmentId: string,
  actorUserId: string
) {
  const enrollment = await prisma.partnerApiProgramEnrollment.update({
    where: { id: enrollmentId },
    data: { status: "approved", approvedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "partner_api.approved",
    entityType: "PartnerApiProgramEnrollment",
    entityId: enrollmentId,
  });
  return enrollment;
}

export async function listPartnerEnrollments() {
  return prisma.partnerApiProgramEnrollment.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
