import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  assertCertificationTransparencyCopy,
  isApiCertificationV2Enabled,
} from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

export async function submitApiCertificationApplication(params: {
  organisationId: string;
  appName: string;
}) {
  if (!isApiCertificationV2Enabled()) {
    throw new Error("API_CERTIFICATION_DISABLED");
  }
  assertCertificationTransparencyCopy(params.appName);
  const app = await prisma.apiCertificationApplication.create({
    data: {
      ...params,
      status: "submitted",
    },
  });
  await createAuditEvent({
    action: "api_certification.submitted",
    entityType: "ApiCertificationApplication",
    entityId: app.id,
  });
  return app;
}

export async function startApiCertificationReview(applicationId: string, actorUserId: string) {
  const app = await prisma.apiCertificationApplication.update({
    where: { id: applicationId },
    data: { status: "under_review", reviewedBy: actorUserId, reviewedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_certification.reviewed",
    entityType: "ApiCertificationApplication",
    entityId: applicationId,
  });
  return app;
}

export async function certifyApiApplication(
  applicationId: string,
  actorUserId: string,
  reviewNotes?: string,
  certificationTier = "standard"
) {
  const app = await prisma.apiCertificationApplication.update({
    where: { id: applicationId },
    data: {
      status: "certified",
      certifiedAt: new Date(),
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      reviewNotes,
      certificationTier,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_certification.certified",
    entityType: "ApiCertificationApplication",
    entityId: applicationId,
  });
  return app;
}

export async function rejectApiApplication(
  applicationId: string,
  actorUserId: string,
  rejectionReason: string
) {
  assertCertificationTransparencyCopy(rejectionReason);
  const app = await prisma.apiCertificationApplication.update({
    where: { id: applicationId },
    data: {
      status: "rejected",
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      rejectionReason,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_certification.rejected",
    entityType: "ApiCertificationApplication",
    entityId: applicationId,
  });
  return app;
}

export async function listCertificationApplications() {
  return prisma.apiCertificationApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function listPublicCertifiedPartners() {
  if (!isApiCertificationV2Enabled()) return [];
  return prisma.apiCertificationApplication.findMany({
    where: { status: "certified" },
    orderBy: { certifiedAt: "desc" },
    take: 50,
    select: {
      id: true,
      organisationId: true,
      appName: true,
      certificationTier: true,
      certifiedAt: true,
    },
  });
}

/** Legacy path when phase10 enabled but Y5 v2 off */
export async function certifyApiApplicationLegacy(
  applicationId: string,
  actorUserId: string,
  reviewNotes?: string
) {
  return certifyApiApplication(applicationId, actorUserId, reviewNotes);
}
