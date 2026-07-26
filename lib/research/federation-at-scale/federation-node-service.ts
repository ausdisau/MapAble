import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isResearchFederationAtScaleV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

async function requireActiveAgreement(agreementId: string) {
  const agreement = await prisma.federatedResearchAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");
  if (agreement.status !== "approved" && agreement.status !== "active") {
    throw new Error("AGREEMENT_NOT_ACTIVE");
  }
  if (!agreement.syntheticOnly) {
    throw new Error("SYNTHETIC_ONLY_REQUIRED");
  }
  return agreement;
}

export async function registerFederationNode(params: {
  nodeName: string;
  institution?: string;
  scope?: string;
  linkedAgreementId?: string;
}) {
  if (!isResearchFederationAtScaleV2Enabled()) {
    throw new Error("RESEARCH_FEDERATION_DISABLED");
  }
  return prisma.researchFederationNode.create({
    data: {
      nodeName: params.nodeName,
      institution: params.institution,
      scope: params.scope,
      linkedAgreementId: params.linkedAgreementId,
      syntheticOnly: true,
      status: "pending",
    },
  });
}

export async function approveFederationNode(nodeId: string, actorUserId: string) {
  const node = await prisma.researchFederationNode.findUnique({
    where: { id: nodeId },
  });
  if (!node) throw new Error("NODE_NOT_FOUND");
  if (!node.linkedAgreementId) {
    throw new Error("LINKED_AGREEMENT_REQUIRED");
  }
  await requireActiveAgreement(node.linkedAgreementId);

  const updated = await prisma.researchFederationNode.update({
    where: { id: nodeId },
    data: { status: "approved", approvedAt: new Date(), suspendedAt: null },
  });

  await createAuditEvent({
    actorUserId,
    action: "research_federation.approved",
    entityType: "ResearchFederationNode",
    entityId: nodeId,
  });

  return updated;
}

export async function suspendFederationNode(nodeId: string, actorUserId: string) {
  const updated = await prisma.researchFederationNode.update({
    where: { id: nodeId },
    data: { status: "suspended", suspendedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "research_federation.suspended",
    entityType: "ResearchFederationNode",
    entityId: nodeId,
  });
  return updated;
}

export async function revokeFederationNode(nodeId: string, actorUserId: string) {
  const updated = await prisma.researchFederationNode.update({
    where: { id: nodeId },
    data: { status: "revoked", suspendedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "research_federation.revoked",
    entityType: "ResearchFederationNode",
    entityId: nodeId,
  });
  return updated;
}

export async function listFederationNodes() {
  if (!isResearchFederationAtScaleV2Enabled()) {
    return { disabled: true, nodes: [] };
  }
  const nodes = await prisma.researchFederationNode.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { disabled: false, nodes };
}

export async function listPublicFederationNodes() {
  if (!isResearchFederationAtScaleV2Enabled()) return [];
  return prisma.researchFederationNode.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "desc" },
    take: 30,
    select: {
      id: true,
      nodeName: true,
      institution: true,
      scope: true,
      syntheticOnly: true,
      approvedAt: true,
    },
  });
}
