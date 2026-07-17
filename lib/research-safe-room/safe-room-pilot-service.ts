import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isResearchSafeRoomPilotEnabled } from "@/lib/config/y4-civic-platform";
import { prisma } from "@/lib/prisma";

export async function createResearchProject(params: {
  title: string;
  ethicsApprovalId?: string;
}) {
  if (!isResearchSafeRoomPilotEnabled()) {
    throw new Error("RESEARCH_SAFE_ROOM_DISABLED");
  }
  return prisma.researchSafeRoomProject.create({
    data: {
      title: params.title,
      ethicsApprovalId: params.ethicsApprovalId,
      syntheticDataOnly: true,
      accessPolicy: "restricted",
      status: "draft",
    },
  });
}

export async function submitForEthicsReview(projectId: string) {
  const project = await prisma.researchSafeRoomProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (project.status !== "draft") throw new Error("INVALID_PROJECT_STATUS");

  return prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: { status: "ethics_review" },
  });
}

export async function attachSyntheticDataset(
  projectId: string,
  schema: Record<string, unknown>,
  _actorUserId: string
) {
  const project = await prisma.researchSafeRoomProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (!project.syntheticDataOnly) {
    throw new Error("REAL_PII_ATTACHMENT_BLOCKED");
  }

  const metadata = {
    schemaHash: JSON.stringify(schema).slice(0, 64),
    rowCount: typeof schema.rowCount === "number" ? schema.rowCount : 0,
    synthetic: true,
    attachedAt: new Date().toISOString(),
  };

  return prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: {
      datasetMetadataJson: metadata as Prisma.InputJsonValue,
      accessPolicy: "synthetic_only",
    },
  });
}

export async function activateResearchProject(
  projectId: string,
  actorUserId: string
) {
  if (!isResearchSafeRoomPilotEnabled()) {
    throw new Error("RESEARCH_SAFE_ROOM_DISABLED");
  }

  const project = await prisma.researchSafeRoomProject.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (!project.ethicsApprovalId) {
    throw new Error("ETHICS_APPROVAL_REQUIRED");
  }
  if (!project.syntheticDataOnly) {
    throw new Error("REAL_PII_ATTACHMENT_BLOCKED");
  }

  const updated = await prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: {
      status: "active",
      approvedBy: actorUserId,
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "research_safe_room.activated",
    entityType: "ResearchSafeRoomProject",
    entityId: projectId,
  });

  return updated;
}

export async function archiveResearchProject(
  projectId: string,
  actorUserId: string
) {
  const updated = await prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: { status: "archived" },
  });

  await createAuditEvent({
    actorUserId,
    action: "research_safe_room.archived",
    entityType: "ResearchSafeRoomProject",
    entityId: projectId,
  });

  return updated;
}

export async function listResearchProjects() {
  if (!isResearchSafeRoomPilotEnabled()) {
    return { disabled: true, projects: [] };
  }
  const projects = await prisma.researchSafeRoomProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { disabled: false, projects };
}
