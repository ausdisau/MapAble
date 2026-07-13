import { prisma } from "@/lib/prisma";

export type CareOSMissionDetail = {
  id: string;
  requestId: string;
  participantId: string;
  goal: string;
  status: string;
  modules: string[];
  graphJson: unknown;
  alertsJson: unknown;
  proposalsJson: unknown;
  createdAt: Date;
  updatedAt: Date;
  events: Array<{
    id: string;
    eventType: string;
    sourceModule: string;
    sourceEntityId: string | null;
    severity: string;
    summary: string;
    payloadJson: unknown;
    createdAt: Date;
  }>;
  reviews: Array<{
    id: string;
    category: string;
    priority: string;
    title: string;
    summary: string;
    assignedRole: string;
    status: string;
    dueAt: Date;
    participantContactRequired: boolean;
    resolvedAt: Date | null;
  }>;
};

export async function getCareOSMissionDetail(params: {
  missionId: string;
  participantId?: string;
}): Promise<CareOSMissionDetail | null> {
  const missions = await prisma.$queryRaw<Array<Omit<CareOSMissionDetail, "events" | "reviews">>>`
    SELECT "id", "requestId", "participantId", "goal", "status", "modules",
           "graphJson", "alertsJson", "proposalsJson", "createdAt", "updatedAt"
    FROM "careos_missions"
    WHERE "id" = ${params.missionId}
      AND (${params.participantId ?? null}::TEXT IS NULL OR "participantId" = ${params.participantId ?? null})
    LIMIT 1
  `;
  const mission = missions[0];
  if (!mission) return null;

  const events = await prisma.$queryRaw<CareOSMissionDetail["events"]>`
    SELECT "id", "eventType", "sourceModule", "sourceEntityId", "severity",
           "summary", "payloadJson", "createdAt"
    FROM "careos_mission_events"
    WHERE "missionId" = ${params.missionId}
    ORDER BY "createdAt" ASC
  `;
  const reviews = await prisma.$queryRaw<CareOSMissionDetail["reviews"]>`
    SELECT "id", "category", "priority", "title", "summary", "assignedRole",
           "status", "dueAt", "participantContactRequired", "resolvedAt"
    FROM "careos_human_reviews"
    WHERE "missionId" = ${params.missionId}
    ORDER BY "dueAt" ASC
  `;
  return { ...mission, events, reviews };
}
