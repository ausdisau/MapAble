import type { TripTrackingStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { phase4Config } from "@/lib/config/phase4";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<TripTrackingStatus, string> = {
  not_started: "Trip not started yet",
  driver_en_route: "Driver is on the way",
  arrived_for_pickup: "Driver has arrived for pickup",
  participant_on_board: "You are on board",
  in_transit: "Trip in progress",
  arrived_at_destination: "Arrived at destination",
  completed: "Trip completed",
  cancelled: "Trip cancelled",
};

export function plainLanguageTripStatus(status: TripTrackingStatus) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export async function startTripTracking(
  transportBookingId: string,
  _actorUserId: string
) {
  const session = await prisma.tripTrackingSession.upsert({
    where: { transportBookingId },
    create: { transportBookingId, status: "not_started" },
    update: {},
  });

  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { status: "confirmed" },
  });

  return session;
}

export async function updateTripStatus(
  transportBookingId: string,
  status: TripTrackingStatus,
  actorUserId: string,
  message?: string
) {
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { booking: true },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const session = await prisma.tripTrackingSession.upsert({
    where: { transportBookingId },
    create: {
      transportBookingId,
      status,
      startedAt: status !== "not_started" ? new Date() : undefined,
      completedAt: status === "completed" ? new Date() : undefined,
    },
    update: {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    },
  });

  await prisma.tripTrackingEvent.create({
    data: {
      sessionId: session.id,
      eventType: "status_update",
      status,
      message,
      actorUserId,
    },
  });

  const bookingStatusMap: Partial<Record<TripTrackingStatus, string>> = {
    driver_en_route: "driver_en_route",
    arrived_for_pickup: "arrived_for_pickup",
    participant_on_board: "participant_on_board",
    in_transit: "in_transit",
    arrived_at_destination: "arrived_at_destination",
    completed: "completed",
    cancelled: "cancelled",
  };

  if (bookingStatusMap[status]) {
    await prisma.transportBooking.update({
      where: { id: transportBookingId },
      data: { status: bookingStatusMap[status] as never },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "trip.status_updated",
    entityType: "TransportBooking",
    entityId: transportBookingId,
    participantId: tb.participantId,
  });

  if (tb.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: tb.bookingId,
      eventType: "trip_status_updated",
      title: plainLanguageTripStatus(status),
      actorUserId,
    });
  }

  return { session, plainLanguage: plainLanguageTripStatus(status) };
}

export async function reportTripDelay(
  transportBookingId: string,
  actorUserId: string,
  reason: string
) {
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { booking: true },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const session = await prisma.tripTrackingSession.findUnique({
    where: { transportBookingId },
  });

  if (session) {
    await prisma.tripTrackingEvent.create({
      data: {
        sessionId: session.id,
        eventType: "delay_reported",
        message: reason,
        actorUserId,
      },
    });
  }

  await notifyUser(
    tb.participantId,
    "booking",
    "Transport delay reported",
    reason.slice(0, 200)
  );

  if (tb.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: tb.bookingId,
      eventType: "booking_at_risk",
      title: "Transport delay — linked booking at risk",
      description: reason,
      actorUserId,
    });
  }

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const a of admins) {
    await notifyUser(a.id, "booking", "Delayed transport trip", transportBookingId);
  }

  return { atRisk: true };
}

export async function recordTripLocation(
  transportBookingId: string,
  lat: number,
  lng: number,
  actorUserId: string
) {
  if (!phase4Config.transportLiveLocationEnabled) {
    return { skipped: true, reason: "Live location disabled" };
  }

  const session = await prisma.tripTrackingSession.findUnique({
    where: { transportBookingId },
  });
  if (!session) throw new Error("NO_SESSION");

  await prisma.tripLocationPoint.create({
    data: { sessionId: session.id, lat, lng },
  });

  await prisma.tripTrackingEvent.create({
    data: {
      sessionId: session.id,
      eventType: "location_update",
      actorUserId,
    },
  });

  return { recorded: true };
}

export async function getTripTracking(transportBookingId: string) {
  const session = await prisma.tripTrackingSession.findUnique({
    where: { transportBookingId },
    include: {
      events: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });
  if (!session) return null;
  return {
    session,
    plainLanguageStatus: plainLanguageTripStatus(session.status),
  };
}
