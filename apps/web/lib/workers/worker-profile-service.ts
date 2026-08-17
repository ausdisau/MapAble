import type { WorkerCredentialStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { refreshWorkerOnboarding } from "@/lib/onboarding/onboarding-service";
import { prisma } from "@/lib/prisma";
import { syncWorkersOnboardingTask } from "@/lib/provider/onboarding-automation/onboarding-service";

export async function associateWorkerWithOrganisation(
  params:
    | {
        workerProfileId: string;
        userId: string;
        displayName?: string;
        actorUserId: string;
        activate?: boolean;
      }
    | {
        organisationId: string;
        userId: string;
        displayName: string;
        profileSummary?: string;
        serviceTypes?: string[];
        serviceRegions?: string[];
        languages?: string[];
        createdById: string;
        activate?: boolean;
      }
) {
  if ("workerProfileId" in params) {
    const profile = await prisma.workerProfile.update({
      where: { id: params.workerProfileId },
      data: {
        userId: params.userId,
        displayName: params.displayName ?? undefined,
        active: params.activate ?? true,
        joinedAt: new Date(),
      },
    });

    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "worker_profile.associated",
      entityType: "WorkerProfile",
      entityId: profile.id,
      organisationId: profile.organisationId,
      metadata: { userId: params.userId },
    });

    await refreshWorkerOnboarding(profile.id, params.actorUserId);
    await syncWorkersOnboardingTask(profile.organisationId);
    return profile;
  }

  const profile = await prisma.workerProfile.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId,
      displayName: params.displayName,
      profileSummary: params.profileSummary,
      serviceTypes: params.serviceTypes ?? [],
      serviceRegions: params.serviceRegions ?? [],
      languages: params.languages ?? [],
      workerScreeningStatus: "not_provided",
      verificationStatus: "pending_review",
      active: params.activate ?? true,
      joinedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "worker_profile.created",
    entityType: "WorkerProfile",
    entityId: profile.id,
    organisationId: params.organisationId,
  });

  await refreshWorkerOnboarding(profile.id, params.createdById);
  await syncWorkersOnboardingTask(params.organisationId);
  return profile;
}

export async function createWorkerProfile(params: {
  userId: string;
  organisationId: string;
  displayName: string;
  profileSummary?: string;
  serviceTypes?: string[];
  serviceRegions?: string[];
  languages?: string[];
  communicationCapabilities?: string[];
  qualificationsSummary?: string;
  createdById: string;
}) {
  return associateWorkerWithOrganisation({
    organisationId: params.organisationId,
    userId: params.userId,
    displayName: params.displayName,
    profileSummary: params.profileSummary,
    serviceTypes: params.serviceTypes,
    serviceRegions: params.serviceRegions,
    languages: params.languages,
    createdById: params.createdById,
    activate: true,
  });
}

export async function verifyWorkerProfile(
  workerId: string,
  verificationStatus: "verified" | "rejected" | "pending_review",
  adminUserId: string
) {
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: { verificationStatus },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "worker_profile.verification_updated",
    entityType: "WorkerProfile",
    entityId: workerId,
    organisationId: profile.organisationId,
    metadata: { verificationStatus },
  });

  return profile;
}

export async function updateWorkerCredential(
  workerId: string,
  field: "workerScreeningStatus" | "wwccStatus" | "firstAidStatus" | "insuranceStatus",
  status: WorkerCredentialStatus,
  actorUserId: string
) {
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: { [field]: status },
  });
  await createAuditEvent({
    actorUserId,
    action: "worker_profile.credential_updated",
    entityType: "WorkerProfile",
    entityId: workerId,
    metadata: { field, status },
  });
  return profile;
}
