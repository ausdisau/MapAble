import type { TransportTrip } from "@prisma/client";

import { transportAccessibleConfig } from "@/lib/config/transport-accessible";
import { prisma } from "@/lib/prisma";
import { MOBILITY_FIELD_LABELS, parseMobilityRequirements } from "@/lib/transport/mobility-schema";

function mobilitySummary(trip: TransportTrip): string {
  const reqs = parseMobilityRequirements(trip.mobilityRequirements);
  const parts: string[] = [];
  for (const [key, value] of Object.entries(reqs)) {
    if (value === true) {
      const label = MOBILITY_FIELD_LABELS[key as keyof typeof MOBILITY_FIELD_LABELS];
      if (label) parts.push(label);
    }
  }
  return parts.length ? parts.join("; ") : "Standard transport";
}

/**
 * Creates a unified Booking record when a transport trip completes, for NDIS claim workflows.
 * Human approval still required before claim submission.
 */
export async function bridgeTransportTripToBooking(
  trip: TransportTrip
): Promise<{ bookingId: string; created: boolean } | null> {
  if (!transportAccessibleConfig.bookingBridgeEnabled) {
    return null;
  }

  if (trip.status !== "trip_completed" && trip.status !== "closed") {
    return null;
  }

  const existing = await prisma.booking.findFirst({
    where: { transportTripId: trip.id },
  });
  if (existing) {
    return { bookingId: existing.id, created: false };
  }

  const booking = await prisma.booking.create({
    data: {
      participantId: trip.participantId,
      bookingType: "transport",
      status: "completed",
      requestedStart: trip.scheduledStart,
      requestedEnd: trip.scheduledEnd ?? trip.scheduledStart,
      pickupAddress: trip.pickupAddress,
      dropoffAddress: trip.dropoffAddress,
      accessibilitySummary: mobilitySummary(trip),
      participantNotes: trip.accessNotes,
      assignedOrganisationId: trip.providerOrganisationId,
      shareAccessibility: true,
      createdById: trip.participantId,
      transportTripId: trip.id,
    },
  });

  await prisma.bookingTimelineEvent.create({
    data: {
      bookingId: booking.id,
      eventType: "booking_created",
      title: "Transport trip linked",
      description: `Created from transport trip ${trip.id}`,
      actorUserId: trip.participantId,
    },
  });

  return { bookingId: booking.id, created: true };
}
