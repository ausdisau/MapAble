import { phase9Config } from "@/lib/config/phase9";
import { isResearchSafeRoomPilotEnabled } from "@/lib/config/y4-civic-platform";
import { prisma } from "@/lib/prisma";
import {
  activateResearchProject,
  archiveResearchProject,
  attachSyntheticDataset as attachPilotDataset,
  createResearchProject as createPilotProject,
  listResearchProjects as listPilotProjects,
  submitForEthicsReview,
} from "@/lib/research/safe-room/safe-room-pilot-service";

export async function createResearchProject(params: {
  title: string;
  ethicsApprovalId?: string;
}) {
  if (isResearchSafeRoomPilotEnabled()) {
    return createPilotProject(params);
  }
  if (!phase9Config.researchSafeRoomEnabled) {
    throw new Error("RESEARCH_SAFE_ROOM_DISABLED");
  }
  return prisma.researchSafeRoomProject.create({
    data: {
      title: params.title,
      ethicsApprovalId: params.ethicsApprovalId,
      syntheticDataOnly: true,
      accessPolicy: "restricted",
    },
  });
}

export async function listResearchProjects() {
  if (isResearchSafeRoomPilotEnabled()) {
    return listPilotProjects();
  }
  if (!phase9Config.researchSafeRoomEnabled) {
    return { disabled: true, projects: [] };
  }
  const projects = await prisma.researchSafeRoomProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { disabled: false, projects };
}

export async function attachSyntheticDataset(
  projectId: string,
  schema: Record<string, unknown>
) {
  if (isResearchSafeRoomPilotEnabled()) {
    return attachPilotDataset(projectId, schema, "system");
  }
  return prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: {
      status: "active",
      accessPolicy: "synthetic_only",
    },
  });
}

export {
  activateResearchProject,
  archiveResearchProject,
  submitForEthicsReview,
};
