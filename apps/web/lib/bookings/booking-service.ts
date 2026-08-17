import type { BookingType } from "@prisma/client";
import type { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { canShareAccessibilityWithOrganisation } from "@/lib/consent/consent-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { createBookingSchema } from "@/lib/validation/booking";

type CreateBookingInput = z.infer<typeof createBookingSchema> & {
  participantId: string;
  createdById: string;
};

export async function createBooking(input: CreateBookingInput) {
  if (
    input.shareAccessibility &&
    input.assignedOrganisationId
  ) {
    const allowed = await canShareAccessibilityWithOrganisation(
      input.participantId,
      input.assignedOrganisationId,
      input.bookingType as BookingType
    );
    if (!allowed) {
      throw new Error("CONSENT_REQUIRED");
    }
  }

  const status = input.status ?? "requested";

  const booking = await prisma.booking.create({
    data: {
      participantId: input.participantId,
      bookingType: input.bookingType,
      status,
      requestedStart: new Date(input.requestedStart),
      requestedEnd: input.requestedEnd ? new Date(input.requestedEnd) : null,
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      careLocation: input.careLocation,
      accessibilitySummary: input.accessibilitySummary,
      participantNotes: input.participantNotes,
      assignedOrganisationId: input.assignedOrganisationId,
      shareAccessibility: input.shareAccessibility,
      fundingSourceTag: input.fundingSourceTag,
      createdById: input.createdById,
      segments: input.segments?.length
        ? {
            create: input.segments.map((s) => ({
              segmentType: s.segmentType,
              startTime: s.startTime ? new Date(s.startTime) : null,
              endTime: s.endTime ? new Date(s.endTime) : null,
              pickupAddress: s.pickupAddress,
              dropoffAddress: s.dropoffAddress,
              bufferBeforeMinutes: s.bufferBeforeMinutes,
              bufferAfterMinutes: s.bufferAfterMinutes,
              sortOrder: s.sortOrder,
            })),
          }
        : undefined,
    },
    include: { segments: { orderBy: { sortOrder: "asc" } } },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "booking.created",
    entityType: "Booking",
    entityId: booking.id,
    participantId: input.participantId,
    metadata: { bookingType: input.bookingType, status },
  });

  await notifyUser(
    input.participantId,
    "booking",
    "Booking request received",
    `Your ${input.bookingType.replace("_", " + ")} booking request has been submitted. We will confirm details with you soon.`
  );

  return booking;
}

export async function updateBooking(
  bookingId: string,
  data: {
    status?: string;
    providerNotes?: string;
    assignedOrganisationId?: string | null;
    assignedWorkerId?: string | null;
    assignedDriverId?: string | null;
    requestedStart?: string;
    requestedEnd?: string | null;
    pickupAddress?: string | null;
    dropoffAddress?: string | null;
  },
  actorUserId: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...(data.status ? { status: data.status as never } : {}),
      providerNotes: data.providerNotes,
      assignedOrganisationId: data.assignedOrganisationId,
      assignedWorkerId: data.assignedWorkerId,
      assignedDriverId: data.assignedDriverId,
      requestedStart: data.requestedStart
        ? new Date(data.requestedStart)
        : undefined,
      requestedEnd:
        data.requestedEnd === null
          ? null
          : data.requestedEnd
            ? new Date(data.requestedEnd)
            : undefined,
      pickupAddress: data.pickupAddress,
      dropoffAddress: data.dropoffAddress,
    },
    include: { segments: { orderBy: { sortOrder: "asc" } } },
  });

  await createAuditEvent({
    actorUserId,
    action: "booking.updated",
    entityType: "Booking",
    entityId: booking.id,
    participantId: booking.participantId,
    metadata: { status: booking.status },
  });

  return booking;
}
