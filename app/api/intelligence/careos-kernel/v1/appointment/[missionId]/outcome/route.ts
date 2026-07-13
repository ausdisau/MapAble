import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { appendAppointmentMissionEvent } from "@/intelligence/kernel/v1/appointment-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";

const outcomeSchema = z.object({
  outcomeId: z.string().min(1).max(200).optional(),
  summary: z.string().trim().min(3).max(2000),
  observedAt: z.string().datetime().optional(),
  correctionOf: z.string().min(1).max(200).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ missionId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const { missionId } = await context.params;
    const input = outcomeSchema.parse(await request.json());
    const sourceId = input.outcomeId ?? randomUUID();
    const observedAt = input.observedAt ?? new Date().toISOString();
    const result = await appendAppointmentMissionEvent({
      id: randomUUID(),
      missionId,
      participantId: user.id,
      type: "outcome_recorded",
      source: "participant",
      severity: "information",
      occurredAt: observedAt,
      summary: input.correctionOf
        ? "The participant corrected previously recorded appointment outcome evidence."
        : "The participant recorded the appointment outcome.",
      entityId: sourceId,
      payload: {
        evidence: {
          type: input.correctionOf ? "participant_outcome_correction" : "participant_outcome",
          sourceId,
          observedAt,
          summary: input.summary,
          correctionOf: input.correctionOf,
        },
      },
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the outcome evidence.", issues: error.flatten() },
        { status: 400 },
      );
    }
    const code = error instanceof Error ? error.message : "";
    if (code === "CAREOS_APPOINTMENT_MISSION_NOT_FOUND") {
      return NextResponse.json({ error: "Appointment mission not found." }, { status: 404 });
    }
    console.error("[careos-appointment-outcome]", error);
    return NextResponse.json(
      { error: "The appointment outcome could not be recorded." },
      { status: 500 },
    );
  }
}
