import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { appendAppointmentMissionEvent } from "@/intelligence/kernel/v1/appointment-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  entityType: z.enum(["CareRequest", "TransportTrip", "Appointment"]),
  entityId: z.string().min(1).max(200),
  summary: z.string().trim().min(3).max(1000),
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
    if (!rows[0] || rows[0].participantId !== user.id) {
      return NextResponse.json({ error: "Mission not found." }, { status: 404 });
    }

    const result = await appendAppointmentMissionEvent({
      id: randomUUID(),
      missionId,
      participantId: user.id,
      type: "service_completed",
      source:
        input.entityType === "CareRequest"
          ? "care"
          : input.entityType === "TransportTrip"
            ? "transport"
            : "participant",
      severity: "information",
      occurredAt: new Date().toISOString(),
      summary: input.summary,
      entityId: input.entityId,
      payload: { entityType: input.entityType },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: "careos.appointment.service_completed",
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { missionId, replayed: result.replayed },
    });

    return NextResponse.json({ mission: result.state, replayed: result.replayed });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the completion evidence.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-appointment-complete]", error);
    return NextResponse.json(
      { error: "Service completion could not be recorded." },
      { status: 500 },
    );
  }
}
