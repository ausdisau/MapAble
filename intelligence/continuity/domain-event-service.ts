import { randomUUID } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { getMapAbleIntelligenceConfig } from "../config";
import { recordCareOSMissionEvent } from "../operations/mission-state-service";

import {
  analyseCareOSOperationalEvent,
  type CareOSOperationalEvent,
} from "./event-engine";

type MissionRef = { id: string; requestId: string };

async function resolveMission(params: {
  participantId: string;
  missionId?: string;
  sourceModule: CareOSOperationalEvent["sourceModule"];
  sourceEntityId?: string;
}): Promise<MissionRef | null> {
  if (params.missionId) {
    const rows = await prisma.$queryRaw<MissionRef[]>`
      SELECT "id", "requestId"
      FROM "careos_missions"
      WHERE "id" = ${params.missionId}
        AND "participantId" = ${params.participantId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  if (params.sourceEntityId) {
    const rows = await prisma.$queryRaw<MissionRef[]>`
      SELECT m."id", m."requestId"
      FROM "careos_action_receipts" r
      JOIN "careos_missions" m ON m."id" = r."requestId"
      WHERE r."participantId" = ${params.participantId}
        AND r."resultEntityId" = ${params.sourceEntityId}
        AND r."status" = 'completed'
      ORDER BY r."completedAt" DESC
      LIMIT 1
    `;
    if (rows[0]) return rows[0];
  }

  // Care and Transport events must never guess which open mission they belong to.
  if (params.sourceModule === "care" || params.sourceModule === "transport") {
    return null;
  }

  const rows = await prisma.$queryRaw<MissionRef[]>`
    SELECT "id", "requestId"
    FROM "careos_missions"
    WHERE "participantId" = ${params.participantId}
      AND "status" NOT IN ('completed', 'cancelled')
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function emitCareOSDomainEvent(params: {
  participantId: string;
  missionId?: string;
  eventType: CareOSOperationalEvent["eventType"];
  sourceModule: CareOSOperationalEvent["sourceModule"];
  sourceEntityId?: string;
  summary: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ eventId: string; reviewId: string | null } | null> {
  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled || !config.careOSEventAutomationEnabled) {
    return null;
  }

  const mission = await resolveMission(params);
  if (!mission) return null;

  const event: CareOSOperationalEvent = {
    missionId: mission.id,
    participantId: params.participantId,
    eventType: params.eventType,
    sourceModule: params.sourceModule,
    sourceEntityId: params.sourceEntityId,
    summary: params.summary,
    occurredAt: new Date().toISOString(),
    metadata: params.metadata,
  };
  const intervention = analyseCareOSOperationalEvent(event);
  const eventId = await recordCareOSMissionEvent({
    missionId: mission.id,
    participantId: params.participantId,
    eventType: event.eventType,
    sourceModule: event.sourceModule,
    sourceEntityId: event.sourceEntityId,
    severity: intervention.severity,
    summary: event.summary,
    payload: {
      occurredAt: event.occurredAt,
      intervention,
      metadata: event.metadata ?? {},
    },
  });

  let reviewId: string | null = null;
  if (intervention.humanReviewRequired && intervention.assignedRole) {
    reviewId = randomUUID();
    const evidence = JSON.stringify([
      `${event.sourceModule}:${event.sourceEntityId ?? "unknown"}`,
    ]);
    const inserted = await prisma.$executeRaw`
      INSERT INTO "careos_human_reviews" (
        "id", "missionId", "requestId", "participantId", "category",
        "priority", "title", "summary", "assignedRole", "status", "dueAt",
        "participantContactRequired", "evidenceJson", "createdAt", "updatedAt"
      )
      SELECT
        ${reviewId}, ${mission.id}, ${mission.requestId}, ${params.participantId},
        ${event.eventType}, ${intervention.severity}, ${intervention.title},
        ${intervention.explanation}, ${intervention.assignedRole}, 'open',
        NOW() + CASE WHEN ${intervention.severity} = 'urgent'
          THEN INTERVAL '4 hours' ELSE INTERVAL '24 hours' END,
        true, CAST(${evidence} AS JSONB), NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "careos_human_reviews"
        WHERE "missionId" = ${mission.id}
          AND "category" = ${event.eventType}
          AND "status" IN ('open', 'assigned', 'in_progress')
      )
    `;
    if (inserted !== 1) reviewId = null;
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    action: "careos.domain_event.recorded",
    entityType: "CareOSMissionEvent",
    entityId: eventId,
    metadata: {
      missionId: mission.id,
      eventType: event.eventType,
      severity: intervention.severity,
      humanReviewCreated: Boolean(reviewId),
      sourceModule: event.sourceModule,
    },
  });

  return { eventId, reviewId };
}

export async function emitCareOSDomainEventBestEffort(
  params: Parameters<typeof emitCareOSDomainEvent>[0],
): Promise<void> {
  try {
    await emitCareOSDomainEvent(params);
  } catch (error) {
    console.error("[careos-domain-event]", error);
  }
}
