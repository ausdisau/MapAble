import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import {
  analyseCareOSOperationalEvent,
  careOSOperationalEventSchema,
} from "@/intelligence/continuity/event-engine";
import { recordCareOSMissionEvent } from "@/intelligence/operations/mission-state-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

function canSubmitForAnotherParticipant(
  role: Parameters<typeof hasPermission>[0],
): boolean {
  return (
    isAdminRole(role) ||
    hasPermission(role, "coordinator:portal") ||
    hasPermission(role, "continuity:manage")
  );
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (
    !config.careOSPersistenceEnabled ||
    !config.careOSEventAutomationEnabled
  ) {
    return NextResponse.json(
      { error: "CareOS event automation is disabled." },
      { status: 503 },
    );
  }

  try {
    const event = careOSOperationalEventSchema.parse(await request.json());
    if (
      event.participantId !== user.id &&
      !canSubmitForAnotherParticipant(user.primaryRole)
    ) {
      return NextResponse.json(
        { error: "You cannot submit an event for this participant." },
        { status: 403 },
      );
    }

    const mission = await prisma.$queryRaw<Array<{ participantId: string }>>`
      SELECT "participantId"
      FROM "careos_missions"
      WHERE "id" = ${event.missionId}
      LIMIT 1
    `;
    if (!mission[0] || mission[0].participantId !== event.participantId) {
      return NextResponse.json(
        { error: "CareOS mission not found for this participant." },
        { status: 404 },
      );
    }

    const intervention = analyseCareOSOperationalEvent(event);
    const eventId = await recordCareOSMissionEvent({
      missionId: event.missionId,
      participantId: event.participantId,
      eventType: event.eventType,
      sourceModule: event.sourceModule,
      sourceEntityId: event.sourceEntityId,
      severity: intervention.severity,
      summary: event.summary,
      payload: {
        occurredAt: event.occurredAt ?? new Date().toISOString(),
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
      await prisma.$executeRaw`
        INSERT INTO "careos_human_reviews" (
          "id", "missionId", "requestId", "participantId", "category",
          "priority", "title", "summary", "assignedRole", "status", "dueAt",
          "participantContactRequired", "evidenceJson", "createdAt", "updatedAt"
        )
        SELECT
          ${reviewId}, "id", "requestId", "participantId",
          ${event.eventType}, ${intervention.severity}, ${intervention.title},
          ${intervention.explanation}, ${intervention.assignedRole}, 'open',
          NOW() + CASE WHEN ${intervention.severity} = 'urgent'
            THEN INTERVAL '4 hours' ELSE INTERVAL '24 hours' END,
          true, CAST(${evidence} AS JSONB), NOW(), NOW()
        FROM "careos_missions"
        WHERE "id" = ${event.missionId}
      `;
    }

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: event.participantId,
      action: "careos.operational_event.recorded",
      entityType: "CareOSMissionEvent",
      entityId: eventId,
      metadata: {
        missionId: event.missionId,
        eventType: event.eventType,
        severity: intervention.severity,
        humanReviewCreated: Boolean(reviewId),
      },
    });

    return NextResponse.json(
      {
        eventId,
        intervention,
        reviewId,
        actionsExecuted: false,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the CareOS event.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-events]", error);
    return NextResponse.json(
      { error: "The CareOS event could not be recorded." },
      { status: 500 },
    );
  }
}
