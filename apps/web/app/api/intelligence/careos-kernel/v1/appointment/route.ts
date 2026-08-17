import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { buildAppointmentMission } from "@/intelligence/kernel/v1/appointment-kernel";
import { persistAppointmentMission } from "@/intelligence/kernel/v1/appointment-persistence";
import { appointmentMissionRequestSchema } from "@/intelligence/kernel/v1/appointment-types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSNetworkEnabled || !config.modules.care) {
    return NextResponse.json(
      { error: "CareOS appointment missions are disabled." },
      { status: 503 },
    );
  }
  if (!hasPermission(user.primaryRole, "care:read:self")) {
    return NextResponse.json(
      { error: "You cannot build an appointment mission." },
      { status: 403 },
    );
  }

  try {
    const input = appointmentMissionRequestSchema.parse(await request.json());
    const mission = await buildAppointmentMission({ user, request: input });
    let persisted = false;

    if (config.careOSPersistenceEnabled) {
      try {
        await persistAppointmentMission({ request: input, state: mission });
        persisted = true;
      } catch (error) {
        console.error("[careos-kernel-v1-appointment-persistence]", error);
      }
    }

    if (config.auditEnabled) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole,
        participantId: user.id,
        action: "careos.kernel_v1.appointment_built",
        entityType: "CareOSAppointmentMission",
        entityId: mission.missionId,
        metadata: {
          phase: mission.phase,
          authorityDecision: mission.authority.decision,
          dependencyStatuses: mission.dependencies.map((item) => ({
            id: item.id,
            status: item.status,
          })),
          pendingConfirmations: mission.pendingConfirmations,
          humanReviewRequired: mission.humanReviewRequired,
          eventTypes: mission.events.map((event) => event.type),
          persisted,
        },
      });
    }

    return NextResponse.json({
      kernelVersion: "1.0",
      missionType: "appointment",
      mission,
      persisted,
      execution: {
        actionsExecuted: false,
        confirmationEndpoint: "/api/intelligence/careos-actions/prepare",
        standardPath: "/dashboard",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the appointment mission details.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-kernel-v1-appointment]", error);
    return NextResponse.json(
      { error: "The appointment mission could not be prepared." },
      { status: 500 },
    );
  }
}
