import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildAppointmentMission } from "@/intelligence/kernel/v1/appointment-service";
import { appointmentMissionRequestSchema } from "@/intelligence/kernel/v1/appointment-types";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

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
      { error: "You cannot create an appointment mission for this account." },
      { status: 403 },
    );
  }

  try {
    const input = appointmentMissionRequestSchema.parse(await request.json());
    const mission = await buildAppointmentMission({ user, request: input });

    if (config.auditEnabled) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole,
        participantId: user.id,
        action: "careos.kernel_v1.appointment_built",
        entityType: "CareOSAppointmentMission",
        entityId: mission.state.missionId,
        metadata: {
          kernelVersion: mission.kernelVersion,
          missionType: mission.missionType,
          authorityDecision: mission.state.authority.decision,
          dependencyStatuses: mission.state.dependencies.map((dependency) => ({
            id: dependency.id,
            status: dependency.status,
            evidenceCount: dependency.evidence.length,
          })),
          pendingConfirmations: mission.state.pendingConfirmations,
          humanReviewRequired: mission.state.humanReviewRequired,
          eventTypes: mission.state.events.map((event) => event.type),
        },
      });
    }

    return NextResponse.json(mission, { status: 201 });
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
