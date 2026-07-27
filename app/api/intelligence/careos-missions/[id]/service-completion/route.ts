import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { appendAppointmentMissionEvent } from "@/intelligence/kernel/v1/appointment-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { isAdminRole } from "@/lib/auth/roles";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  serviceType: z.enum(["care", "transport", "appointment", "other"]),
  sourceEntityId: z.string().min(1),
  completedAt: z.string().datetime().optional(),
  summary: z.string().trim().min(3).max(1000),
  evidence: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const { id: missionId } = await context.params;
    const input = bodySchema.parse(await request.json());
    const rows = await prisma.$queryRaw<Array<{ participantId: string }>>`
      SELECT "participantId" FROM "careos_missions"
      WHERE "id" = ${missionId}
      LIMIT 1
    `;
    const mission = rows[0];
    if (!mission) {
      return NextResponse.json({ error: "Mission not found." }, { status: 404 });
    }

    const canRecord =
      mission.participantId === user.id ||
      user.primaryRole === "support_coordinator" ||
      isAdminRole(user.primaryRole);
    if (!canRecord) {
      return NextResponse.json(
        { error: "You cannot record completion for this mission." },
        { status: 403 },
      );
    }

    const eventId = randomUUID();
    const result = await appendAppointmentMissionEvent({
      id: eventId,
      missionId,
      participantId: mission.participantId,
      type: "service_completed",
      source:
        input.serviceType === "care"
          ? "care"
          : input.serviceType === "transport"
            ? "transport"
            : "careos",
      severity: "information",
      occurredAt: input.completedAt ?? new Date().toISOString(),
      summary: input.summary,
      entityId: input.sourceEntityId,
      payload: {
        serviceType: input.serviceType,
        evidence: input.evidence,
        recordedByUserId: user.id,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: mission.participantId,
      action: "careos.mission.service_completed",
      entityType: "CareOSMissionEvent",
      entityId: eventId,
      metadata: {
        missionId,
        serviceType: input.serviceType,
        sourceEntityId: input.sourceEntityId,
        replayed: result.replayed,
      },
    });

    return NextResponse.json(
      { eventId, mission: result.state, replayed: result.replayed },
      { status: result.replayed ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the completion evidence.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-service-completion]", error);
    return NextResponse.json(
      { error: "Service completion could not be recorded." },
      { status: 500 },
    );
  }
}
