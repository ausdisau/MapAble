import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  AppointmentMissionRequest,
  AppointmentMissionState,
} from "./appointment-types";

export async function persistAppointmentMission(params: {
  request: AppointmentMissionRequest;
  state: AppointmentMissionState;
}): Promise<void> {
  const graphJson = {
    type: "appointment",
    appointment: params.request.appointment,
    state: params.state,
  } as unknown as Prisma.InputJsonValue;
  const alertsJson = params.state.events
    .filter((event) => event.type === "continuity_alerted")
    .map((event) => ({
      id: event.id,
      severity: event.severity,
      summary: event.summary,
    })) as unknown as Prisma.InputJsonValue;
  const proposalsJson = params.state.pendingConfirmations.map((action) => ({
    action,
    status: "awaiting_participant",
  })) as unknown as Prisma.InputJsonValue;
  const modulesJson = ["core", "care", "transport", "access"];

  await prisma.$transaction(async (tx) => {
    await tx.careOSMission.upsert({
      where: { id: params.state.missionId },
      create: {
        id: params.state.missionId,
        requestId: params.state.missionId,
        participantId: params.state.participantId,
        missionType: "APPOINTMENT",
        desiredOutcome: params.state.outcome,
        status: params.state.phase,
        graphJson,
        alertsJson,
        proposalsJson,
        modulesJson,
        correlationId: params.state.missionId,
        inputSummary: {
          appointmentTitle: params.request.appointment.title,
          location: params.request.appointment.location,
          startAt: params.request.appointment.startAt,
        } as Prisma.InputJsonValue,
      },
      update: {
        desiredOutcome: params.state.outcome,
        status: params.state.phase,
        graphJson,
        alertsJson,
        proposalsJson,
        modulesJson,
        stateVersion: { increment: 1 },
      },
    });

    for (const event of params.state.events) {
      const existing = await tx.careOSMissionEvent.findUnique({
        where: {
          missionId_eventKey: {
            missionId: params.state.missionId,
            eventKey: event.id,
          },
        },
      });
      if (existing) continue;
      await tx.careOSMissionEvent.create({
        data: {
          id: event.id,
          missionId: params.state.missionId,
          participantId: params.state.participantId,
          eventType: event.type,
          sourceModule: event.source,
          sourceEntityId: event.entityId,
          severity: event.severity,
          summary: event.summary,
          payloadJson: event.payload as Prisma.InputJsonValue,
          eventKey: event.id,
          createdAt: new Date(event.occurredAt),
        },
      });
    }

    if (params.state.humanReviewRequired) {
      const open = await tx.careOSHumanReview.findFirst({
        where: {
          missionId: params.state.missionId,
          category: "care_coordination",
          status: { in: ["open", "assigned", "in_progress"] },
        },
        select: { id: true },
      });
      if (!open) {
        await tx.careOSHumanReview.create({
          data: {
            id: randomUUID(),
            missionId: params.state.missionId,
            requestId: params.state.missionId,
            participantId: params.state.participantId,
            category: "care_coordination",
            priority: "attention",
            title: "Review appointment support mission",
            summary:
              "Review unresolved authority, competency, backup or continuity requirements before execution.",
            assignedRole: "support_coordinator",
            status: "open",
            dueAt: new Date(Date.now() + 24 * 60 * 60_000),
            participantContactRequired: true,
            evidenceJson: params.state.authority
              .reasons as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  });
}
