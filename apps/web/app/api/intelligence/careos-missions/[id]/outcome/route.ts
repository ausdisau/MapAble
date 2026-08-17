import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { appendAppointmentMissionEvent } from "@/intelligence/kernel/v1/appointment-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  outcome: z.enum(["achieved", "partly_achieved", "not_achieved", "cancelled"]),
  summary: z.string().trim().min(3).max(2000),
  correctionOf: z.string().uuid().optional(),
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

    if (input.correctionOf) {
      const prior = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "careos_mission_events"
        WHERE "id" = ${input.correctionOf}
          AND "missionId" = ${missionId}
          AND "participantId" = ${user.id}
          AND "eventType" = 'outcome_recorded'
        LIMIT 1
      `;
      if (!prior[0]) {
        return NextResponse.json(
          { error: "The outcome record to correct was not found." },
          { status: 404 },
        );
      }
    }

    const eventId = randomUUID();
    const observedAt = new Date().toISOString();
    const result = await appendAppointmentMissionEvent({
      id: eventId,
      missionId,
      participantId: user.id,
      type: "outcome_recorded",
      source: "participant",
      severity: "information",
      occurredAt: observedAt,
      summary: input.summary,
      entityId: eventId,
      payload: {
        outcome: input.outcome,
        correctionOf: input.correctionOf,
        evidence: {
          type: input.correctionOf
            ? "participant_outcome_correction"
            : "participant_outcome",
          sourceId: eventId,
          observedAt,
          summary: input.summary,
          correctionOf: input.correctionOf,
        },
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: input.correctionOf
        ? "careos.appointment.outcome_corrected"
        : "careos.appointment.outcome_recorded",
      entityType: "CareOSAppointmentOutcome",
      entityId: eventId,
      metadata: {
        missionId,
        outcome: input.outcome,
        correctionOf: input.correctionOf ?? null,
      },
    });

    return NextResponse.json(
      { mission: result.state, eventId, replayed: result.replayed },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the outcome evidence.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-appointment-outcome]", error);
    return NextResponse.json(
      { error: "The outcome could not be recorded." },
      { status: 500 },
    );
  }
}
