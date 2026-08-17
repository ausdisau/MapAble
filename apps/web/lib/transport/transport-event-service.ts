import type { Prisma, TransportTripStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordTripEvent(params: {
  tripId: string;
  actorUserId?: string;
  eventType: string;
  fromStatus?: TransportTripStatus | null;
  toStatus?: TransportTripStatus | null;
  message?: string;
  metadata?: Record<string, unknown>;
  participantId?: string;
  organisationId?: string;
}) {
  const event = await prisma.transportTripEvent.create({
    data: {
      tripId: params.tripId,
      actorUserId: params.actorUserId,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus ?? undefined,
      eventType: params.eventType,
      message: params.message,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: `transport_trip.${params.eventType}`,
      entityType: "TransportTrip",
      entityId: params.tripId,
      participantId: params.participantId,
      organisationId: params.organisationId,
      metadata: {
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        ...params.metadata,
      },
    });
  }

  return event;
}
