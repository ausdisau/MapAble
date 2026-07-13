import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { appendAppointmentMissionEvent } from "@/intelligence/kernel/v1/appointment-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";

const completionSchema = z.object({
  serviceType: z.enum(["care", "transport", "appointment"]),
  serviceEntityId: z.string().min(1).max(200),
  completedAt: z.string().datetime().optional(),
  summary: z.string().trim().min(3).max(1000),
  receiptId: z.string().max(200).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ missionId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "care:manage:self")) {
    return NextResponse.json(
      { error: "You cannot record service completion for this mission." },
      { status: 403 },
    );
  }

  try {
    const { missionId } = await context.params;
    const input = completionSchema.parse(await request.json());
    const result = await appendAppointmentMissionEvent({
      id: randomUUID(),
      missionId,
      participantId: user.id,
      type: "service_completed",
      source: input.serviceType === "appointment" ? "careos" : input.serviceType,
      severity: "information",
      occurredAt: input.completedAt ?? new Date().toISOString(),
      summary: input.summary,
      entityId: input.serviceEntityId,
      payload: {
        serviceType: input.serviceType,
        receiptId: input.receiptId,
        entityType:
          input.serviceType === "care"
            ? "CareRequest"
            : input.serviceType === "transport"
              ? "TransportTrip"
              : "Appointment",
      },
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the completion evidence.", issues: error.flatten() },
        { status: 400 },
      );
    }
    const code = error instanceof Error ? error.message : "";
    if (code === "CAREOS_APPOINTMENT_MISSION_NOT_FOUND") {
      return NextResponse.json({ error: "Appointment mission not found." }, { status: 404 });
    }
    console.error("[careos-appointment-service-completion]", error);
    return NextResponse.json(
      { error: "Service completion could not be recorded." },
      { status: 500 },
    );
  }
}
