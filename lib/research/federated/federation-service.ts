import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isFederatedResearchV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

function assertSyntheticOnly(syntheticOnly: boolean) {
  if (!syntheticOnly) {
    throw new Error("SYNTHETIC_ONLY_REQUIRED");
  }
}

async function requireApprovedSafeRoomProject(projectId: string) {
  const project = await prisma.researchSafeRoomProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("SAFE_ROOM_PROJECT_NOT_FOUND");
  if (project.status !== "active" && project.status !== "ethics_review") {
    throw new Error("ETHICS_PREREQUISITE_NOT_MET");
  }
  if (!project.syntheticDataOnly) {
    throw new Error("SYNTHETIC_ONLY_REQUIRED");
  }
  return project;
}

export async function createFederatedAgreement(params: {
  partnerName: string;
  scope: string;
  linkedSafeRoomProjectId?: string;
  syntheticOnly?: boolean;
}) {
  if (!isFederatedResearchV2Enabled()) {
    throw new Error("FEDERATED_RESEARCH_DISABLED");
  }
  assertSyntheticOnly(params.syntheticOnly ?? true);

  return prisma.federatedResearchAgreement.create({
    data: {
      partnerName: params.partnerName,
      scope: params.scope,
      linkedSafeRoomProjectId: params.linkedSafeRoomProjectId,
      syntheticOnly: true,
      status: "draft",
    },
  });
}

export async function submitAgreementForEthicsReview(
  agreementId: string,
  ethicsReviewNotes?: string
) {
  return prisma.federatedResearchAgreement.update({
    where: { id: agreementId },
    data: { status: "ethics_review", ethicsReviewNotes },
  });
}

export async function approveFederatedAgreement(
  agreementId: string,
  actorUserId: string,
  linkedSafeRoomProjectId?: string
) {
  const agreement = await prisma.federatedResearchAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");
  assertSyntheticOnly(agreement.syntheticOnly);

  const projectId = linkedSafeRoomProjectId ?? agreement.linkedSafeRoomProjectId;
  if (projectId) {
    await requireApprovedSafeRoomProject(projectId);
  } else if (agreement.status !== "ethics_review") {
    throw new Error("ETHICS_PREREQUISITE_NOT_MET");
  }

  const updated = await prisma.federatedResearchAgreement.update({
    where: { id: agreementId },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: actorUserId,
      linkedSafeRoomProjectId: projectId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "federated_research.approved",
    entityType: "FederatedResearchAgreement",
    entityId: agreementId,
  });

  return updated;
}

export async function activateFederatedAgreement(
  agreementId: string,
  _actorUserId: string
) {
  const agreement = await prisma.federatedResearchAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement || agreement.status !== "approved") {
    throw new Error("AGREEMENT_NOT_APPROVED");
  }

  return prisma.federatedResearchAgreement.update({
    where: { id: agreementId },
    data: { status: "active" },
  });
}

export async function archiveFederatedAgreement(agreementId: string, actorUserId: string) {
  const updated = await prisma.federatedResearchAgreement.update({
    where: { id: agreementId },
    data: { status: "archived", archivedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "federated_research.archived",
    entityType: "FederatedResearchAgreement",
    entityId: agreementId,
  });
  return updated;
}

export async function listFederatedAgreements() {
  if (!isFederatedResearchV2Enabled()) {
    return { disabled: true, agreements: [] };
  }
  const agreements = await prisma.federatedResearchAgreement.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { disabled: false, agreements };
}

export async function listActiveFederatedAgreements() {
  const { disabled, agreements } = await listFederatedAgreements();
  if (disabled) return [];
  return agreements.filter((a) => a.status === "approved" || a.status === "active");
}
