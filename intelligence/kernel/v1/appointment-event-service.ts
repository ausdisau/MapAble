import { prisma } from "@/lib/prisma";

import {
  appointmentEventSchema,
  type AppointmentEvent,
  type AppointmentMissionState,
} from "./appointment-types";
import { reduceAppointmentMission } from "./event-reducer";

type StoredAppointmentGraph = {
  type: "appointment";
  appointment?: Record<string, unknown>;
  state: AppointmentMissionState;
};

export async function appendAppointmentMissionEvent(
  rawEvent: AppointmentEvent,
): Promise<{ state: AppointmentMissionState; replayed: boolean }> {
  const event = appointmentEventSchema.parse(rawEvent);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "careos_mission_events"
      WHERE "id" = ${event.id}
      LIMIT 1
    `;

    const rows = await tx.$queryRaw<
      Array<{ participantId: string; graphJson: StoredAppointmentGraph }>
    >`
      SELECT "participantId", "graphJson"
      FROM "careos_missions"
      WHERE "id" = ${event.missionId}
      LIMIT 1
    `;
    const mission = rows[0];
    if (!mission || mission.participantId !== event.participantId) {
      throw new Error("CAREOS_APPOINTMENT_MISSION_NOT_FOUND");
    }
    if (!mission.graphJson?.state) {
      throw new Error("CAREOS_APPOINTMENT_STATE_UNAVAILABLE");
    }
    if (existing[0]) {
      return { state: mission.graphJson.state, replayed: true };
    }

    const state = reduceAppointmentMission(mission.graphJson.state, event);
    const graphJson = JSON.stringify({ ...mission.graphJson, state });
    const proposalsJson = JSON.stringify(
      state.pendingConfirmations.map((action) => ({
        action,
        status: "awaiting_participant",
      })),
    );
    const payloadJson = JSON.stringify(event.payload);

    await tx.$executeRaw`
      INSERT INTO "careos_mission_events" (
        "id", "missionId", "participantId", "eventType", "sourceModule",
        "sourceEntityId", "severity", "summary", "payloadJson", "createdAt"
      ) VALUES (
        ${event.id}, ${event.missionId}, ${event.participantId}, ${event.type},
        ${event.source}, ${event.entityId}, ${event.severity}, ${event.summary},
        CAST(${payloadJson} AS JSONB), ${new Date(event.occurredAt)}
      )
      ON CONFLICT ("id") DO NOTHING
    `;

    await tx.$executeRaw`
      UPDATE "careos_missions"
      SET "status" = ${state.phase},
          "graphJson" = CAST(${graphJson} AS JSONB),
          "proposalsJson" = CAST(${proposalsJson} AS JSONB),
          "updatedAt" = NOW()
      WHERE "id" = ${event.missionId}
    `;

    return { state, replayed: false };
  });
}
