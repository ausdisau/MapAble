import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

import type {
  CareOSHumanReviewItem,
  CareOSNetworkRequest,
  CareOSNetworkResponse,
} from "../network/types";

export type CareOSMissionSummary = {
  id: string;
  requestId: string;
  participantId: string;
  goal: string;
  status: string;
  modules: string[];
  createdAt: Date;
  updatedAt: Date;
};

export async function persistCareOSMission(params: {
  participantId: string;
  request: CareOSNetworkRequest;
  response: CareOSNetworkResponse;
}): Promise<string> {
  const missionId = randomUUID();
  const graphJson = JSON.stringify(params.response.mission);
  const alertsJson = JSON.stringify(params.response.continuityAlerts);
  const proposalsJson = JSON.stringify(params.response.actionProposals);
  await prisma.$executeRaw`
    INSERT INTO "careos_missions" (
      "id", "requestId", "participantId", "goal", "status", "modules",
      "graphJson", "alertsJson", "proposalsJson", "createdAt", "updatedAt"
    ) VALUES (
      ${missionId}, ${params.response.requestId}, ${params.participantId},
      ${params.response.goal}, ${params.response.status}, ${params.request.modules},
      CAST(${graphJson} AS JSONB), CAST(${alertsJson} AS JSONB),
      CAST(${proposalsJson} AS JSONB), NOW(), NOW()
    )
  `;

  for (const item of params.response.humanReviewQueue) {
    await persistHumanReview(missionId, item);
  }
  return missionId;
}

async function persistHumanReview(
  missionId: string,
  item: CareOSHumanReviewItem,
): Promise<void> {
  const evidence = JSON.stringify(item.evidence);
  await prisma.$executeRaw`
    INSERT INTO "careos_human_reviews" (
      "id", "missionId", "requestId", "participantId", "category",
      "priority", "title", "summary", "assignedRole", "status", "dueAt",
      "participantContactRequired", "evidenceJson", "createdAt", "updatedAt"
    ) VALUES (
      ${item.id}, ${missionId}, ${item.requestId}, ${item.participantId},
      ${item.category}, ${item.priority}, ${item.title}, ${item.summary},
      ${item.assignedRole}, ${item.status}, ${new Date(item.dueAt)},
      ${item.participantContactRequired}, CAST(${evidence} AS JSONB), NOW(), NOW()
    )
  `;
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
}): Promise<string> {
  const id = randomUUID();
  const payload = params.payload ? JSON.stringify(params.payload) : null;
  await prisma.$executeRaw`
    INSERT INTO "careos_mission_events" (
      "id", "missionId", "participantId", "eventType", "sourceModule",
      "sourceEntityId", "severity", "summary", "payloadJson", "createdAt"
    ) VALUES (
      ${id}, ${params.missionId}, ${params.participantId}, ${params.eventType},
      ${params.sourceModule}, ${params.sourceEntityId ?? null},
      ${params.severity ?? "information"}, ${params.summary},
      CASE WHEN ${payload}::TEXT IS NULL THEN NULL ELSE CAST(${payload} AS JSONB) END,
      NOW()
    )
  `;
  return id;
}

export async function listCareOSMissions(
  participantId: string,
  limit = 20,
): Promise<CareOSMissionSummary[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return prisma.$queryRaw<CareOSMissionSummary[]>`
    SELECT "id", "requestId", "participantId", "goal", "status", "modules",
           "createdAt", "updatedAt"
    FROM "careos_missions"
    WHERE "participantId" = ${participantId}
    ORDER BY "createdAt" DESC
    LIMIT ${safeLimit}
  `;
}

export async function listCareOSHumanReviews(params: {
  participantId?: string;
  assignedRole?: string;
  status?: string;
  limit?: number;
}) {
  const safeLimit = Math.max(1, Math.min(params.limit ?? 50, 100));
  return prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT "id", "missionId", "requestId", "participantId", "category",
           "priority", "title", "summary", "assignedRole", "status", "dueAt",
           "participantContactRequired", "evidenceJson", "resolvedAt",
           "createdAt", "updatedAt"
    FROM "careos_human_reviews"
    WHERE (${params.participantId ?? null}::TEXT IS NULL OR "participantId" = ${params.participantId ?? null})
      AND (${params.assignedRole ?? null}::TEXT IS NULL OR "assignedRole" = ${params.assignedRole ?? null})
      AND (${params.status ?? null}::TEXT IS NULL OR "status" = ${params.status ?? null})
    ORDER BY
      CASE "priority" WHEN 'urgent' THEN 3 WHEN 'attention' THEN 2 ELSE 1 END DESC,
      "dueAt" ASC
    LIMIT ${safeLimit}
  `;
}

export async function updateCareOSHumanReview(params: {
  id: string;
  status: "assigned" | "in_progress" | "resolved" | "cancelled";
}): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "careos_human_reviews"
    SET "status" = ${params.status},
        "resolvedAt" = CASE WHEN ${params.status} = 'resolved' THEN NOW() ELSE "resolvedAt" END,
        "updatedAt" = NOW()
    WHERE "id" = ${params.id}
  `;
  return changed === 1;
}
