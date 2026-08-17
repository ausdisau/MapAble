import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function providerAcceptBooking(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      providerResponseStatus: "accepted",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
      status: "confirmed",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "booking.provider_accepted",
    entityType: "Booking",
    entityId: bookingId,
    participantId: booking.participantId,
    organisationId,
  });

  await recordBookingTimelineEvent({
    bookingId,
    eventType: "provider_accepted",
    title: "Provider accepted your booking",
    description: note,
    actorUserId,
  });

  await notifyUser(
    booking.participantId,
    "booking",
    "Booking accepted",
    "Your provider has accepted the booking request."
  );

  return booking;
}

export async function providerDeclineBooking(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      providerResponseStatus: "declined",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
      status: "awaiting_provider_acceptance",
      assignedOrganisationId: null,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "booking.provider_declined",
    entityType: "Booking",
    entityId: bookingId,
    participantId: booking.participantId,
    organisationId,
    metadata: { note },
  });

  await recordBookingTimelineEvent({
    bookingId,
    eventType: "provider_declined",
    title: "Provider declined booking",
    description: note ?? "Returned to admin review.",
    actorUserId,
  });

  await notifyUser(
    booking.participantId,
    "booking",
    "Booking update",
    "Your booking request was declined by the provider. Our team will follow up."
  );

  return booking;
}

export async function assignBookingToOrganisation(
  bookingId: string,
  organisationId: string,
  actorUserId: string
) {
  const { assertProviderReadyToServe } = await import(
    "@/lib/onboarding/provider-service-ready"
  );
  await assertProviderReadyToServe(organisationId);

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      assignedOrganisationId: organisationId,
      providerResponseStatus: "sent",
      status: "awaiting_provider_acceptance",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "booking.assigned",
    entityType: "Booking",
    entityId: bookingId,
    organisationId,
  });

  await recordBookingTimelineEvent({
    bookingId,
    eventType: "booking_assigned",
    title: "Booking sent to provider",
    actorUserId,
    isAdminOnly: true,
  });

  return booking;
}
