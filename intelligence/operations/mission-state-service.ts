import type { Prisma } from "@prisma/client";

import {
  appendMissionEvent,
  createCanonicalMission,
  toFabricMissionView,
  type FabricMissionView,
} from "@/lib/careos/canonical-mission-service";
import { prisma } from "@/lib/prisma";

import type {
  CareOSHumanReviewItem,
  CareOSNetworkRequest,
  CareOSNetworkResponse,
} from "../network/types";

export type CareOSMissionSummary = FabricMissionView;

export async function persistCareOSMission(params: {
  participantId: string;
  request: CareOSNetworkRequest;
  response: CareOSNetworkResponse;
  tenantId?: string;
}): Promise<string> {
  const existing = await prisma.careOSMission.findUnique({
    where: { requestId: params.response.requestId },
    select: { id: true },
  });
  if (existing) {
    await prisma.careOSMission.update({
      where: { id: existing.id },
      data: {
        desiredOutcome: params.response.goal,
        status: params.response.status,
        graphJson: params.response.mission as unknown as Prisma.InputJsonValue,
        modulesJson: params.request.modules as unknown as Prisma.InputJsonValue,
        alertsJson:
          params.response.continuityAlerts as unknown as Prisma.InputJsonValue,
        proposalsJson:
          params.response.actionProposals as unknown as Prisma.InputJsonValue,
        stateVersion: { increment: 1 },
      },
    });
    for (const item of params.response.humanReviewQueue) {
      await persistHumanReview(existing.id, item);
    }
    return existing.id;
  }

  const mission = await createCanonicalMission({
    participantId: params.participantId,
    requestId: params.response.requestId,
    missionType: "CAREOS_NETWORK",
    desiredOutcome: params.response.goal,
    status: params.response.status,
    tenantId: params.tenantId,
    graphJson: params.response.mission as unknown as Prisma.InputJsonValue,
    modulesJson: params.request.modules as unknown as Prisma.InputJsonValue,
    alertsJson:
      params.response.continuityAlerts as unknown as Prisma.InputJsonValue,
    proposalsJson:
      params.response.actionProposals as unknown as Prisma.InputJsonValue,
    correlationId: params.response.requestId,
  });

  for (const item of params.response.humanReviewQueue) {
    await persistHumanReview(mission.id, item);
  }
  return mission.id;
}

async function persistHumanReview(
  missionId: string,
  item: CareOSHumanReviewItem,
): Promise<void> {
  await prisma.careOSHumanReview.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      missionId,
      requestId: item.requestId,
      participantId: item.participantId,
      category: item.category,
      priority: item.priority,
      title: item.title,
      summary: item.summary,
      assignedRole: item.assignedRole,
      status: item.status,
      dueAt: new Date(item.dueAt),
      participantContactRequired: item.participantContactRequired,
      evidenceJson: item.evidence as unknown as Prisma.InputJsonValue,
    },
    update: {
      status: item.status,
      summary: item.summary,
      evidenceJson: item.evidence as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function recordCareOSMissionEvent(params: {
  missionId: string;
  participantId: string;
  eventType: string;
  sourceModule: string;
  sourceEntityId?: string;
  severity?: "information" | "attention" | "urgent";
  summary: string;
  payload?: Record<string, unknown>;
  eventKey?: string;
}): Promise<string> {
  const event = await appendMissionEvent({
    missionId: params.missionId,
    participantId: params.participantId,
    eventType: params.eventType,
    sourceModule: params.sourceModule,
    sourceEntityId: params.sourceEntityId,
    severity: params.severity,
    summary: params.summary,
    payloadJson: params.payload as Prisma.InputJsonValue | undefined,
    eventKey:
      params.eventKey ??
      `${params.eventType}:${params.sourceModule}:${params.sourceEntityId ?? "none"}`,
  });
  return event.id;
}

export async function listCareOSMissions(
  participantId: string,
  limit = 20,
): Promise<CareOSMissionSummary[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const rows = await prisma.careOSMission.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });
  return rows.map(toFabricMissionView);
}

export async function listCareOSHumanReviews(params: {
  participantId?: string;
  assignedRole?: string;
  status?: string;
  limit?: number;
}) {
  const safeLimit = Math.max(1, Math.min(params.limit ?? 50, 100));
  return prisma.careOSHumanReview.findMany({
    where: {
      ...(params.participantId
        ? { participantId: params.participantId }
        : {}),
      ...(params.assignedRole ? { assignedRole: params.assignedRole } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: [{ dueAt: "asc" }],
    take: safeLimit,
  });
}

export async function updateCareOSHumanReview(params: {
  id: string;
  status: "assigned" | "in_progress" | "resolved" | "cancelled";
}): Promise<boolean> {
  const result = await prisma.careOSHumanReview.updateMany({
    where: { id: params.id },
    data: {
      status: params.status,
      resolvedAt: params.status === "resolved" ? new Date() : undefined,
    },
  });
  return result.count === 1;
}
