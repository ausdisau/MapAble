import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { assertAssignedDriver } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { buildTripResponse } from "@/lib/transport/transport-response";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";

export async function submitTripEvidence(
  user: CurrentUser,
  tripId: string,
  input: {
    evidenceType: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  await prisma.transportTripEvidence.create({
    data: {
      tripId,
      evidenceType: input.evidenceType,
      notes: input.notes,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      submittedByUserId: user.id,
    },
  });

  if (trip.status === "trip_completed") {
    assertStatusTransition(trip.status, "evidence_submitted");
    const updated = await prisma.transportTrip.update({
      where: { id: tripId },
      data: { status: "evidence_submitted" },
    });
    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: "evidence_submitted",
      fromStatus: trip.status,
      toStatus: "evidence_submitted",
      participantId: trip.participantId,
    });
    return buildTripResponse({ trip: updated, user });
  }

  return buildTripResponse({ trip, user });
}
