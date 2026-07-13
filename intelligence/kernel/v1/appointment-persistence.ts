import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

import type { AppointmentMissionRequest, AppointmentMissionState } from "./appointment-types";

export async function persistAppointmentMission(params: {
  request: AppointmentMissionRequest;
  state: AppointmentMissionState;
}): Promise<void> {
  const graphJson = JSON.stringify({
    type: "appointment",
    appointment: params.request.appointment,
    dependencies: params.state.dependencies,
    authority: params.state.authority,
  });
  const alertsJson = JSON.stringify(
    params.state.events
      .filter((event) => event.type === "continuity_alerted")
      .map((event) => ({
        id: event.id,
        severity: event.severity,
        summary: event.summary,
      })),
  );
  const proposalsJson = JSON.stringify(
    params.state.pendingConfirmations.map((action) => ({
      action,
      status: "awaiting_participant",
    })),
  );

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "careos_missions" (
        "id", "requestId", "participantId", "goal", "status", "modules",
        "graphJson", "alertsJson", "proposalsJson", "createdAt", "updatedAt"
      ) VALUES (
        ${params.state.missionId}, ${params.state.missionId},
        ${params.state.participantId}, ${params.state.outcome}, ${params.state.phase},
        ARRAY['core', 'care', 'transport', 'access']::TEXT[],
        CAST(${graphJson} AS JSONB), CAST(${alertsJson} AS JSONB),
        CAST(${proposalsJson} AS JSONB), NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "status" = EXCLUDED."status",
        "graphJson" = EXCLUDED."graphJson",
        "alertsJson" = EXCLUDED."alertsJson",
        "proposalsJson" = EXCLUDED."proposalsJson",
        "updatedAt" = NOW()
    `;

    for (const event of params.state.events) {
      const payload = JSON.stringify(event.payload);
      await tx.$executeRaw`
        INSERT INTO "careos_mission_events" (
          "id", "missionId", "participantId", "eventType", "sourceModule",
          "sourceEntityId", "severity", "summary", "payloadJson", "createdAt"
        ) VALUES (
          ${event.id}, ${params.state.missionId}, ${params.state.participantId},
          ${event.type}, ${event.source}, ${event.entityId}, ${event.severity},
          ${event.summary}, CAST(${payload} AS JSONB), ${new Date(event.occurredAt)}
        )
        ON CONFLICT ("id") DO NOTHING
      `;
    }

    if (params.state.humanReviewRequired) {
      const evidence = JSON.stringify(params.state.authority.reasons);
      await tx.$executeRaw`
        INSERT INTO "careos_human_reviews" (
          "id", "missionId", "requestId", "participantId", "category",
          "priority", "title", "summary", "assignedRole", "status", "dueAt",
          "participantContactRequired", "evidenceJson", "createdAt", "updatedAt"
        ) VALUES (
          ${randomUUID()}, ${params.state.missionId}, ${params.state.missionId},
          ${params.state.participantId}, 'care_coordination', 'attention',
          'Review appointment support mission',
          'Review unresolved authority, competency, backup or continuity requirements before execution.',
          'support_coordinator', 'open', NOW() + INTERVAL '24 hours', true,
          CAST(${evidence} AS JSONB), NOW(), NOW()
        )
      `;
    }
  });
}
