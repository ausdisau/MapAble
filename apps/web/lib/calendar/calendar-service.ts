import type { CareRequest, CareShift, TransportBooking } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listCalendarEvents(params: {
  participantId?: string;
  organisationId?: string;
  from?: Date;
  to?: Date;
}) {
  return prisma.calendarEvent.findMany({
    where: {
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.organisationId
        ? { organisationId: params.organisationId }
        : {}),
      ...(params.from || params.to
        ? {
            startAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });
}

export async function syncCalendarForCareRequest(request: CareRequest) {
  if (!request.preferredDate) return;
  await prisma.calendarEvent.create({
    data: {
      eventType: "care_request",
      title: request.title,
      description: request.description.slice(0, 200),
      startAt: request.preferredDate,
      endAt: request.preferredDate,
      participantId: request.participantId,
      careRequestId: request.id,
      createdById: request.createdById,
    },
  });
}

export async function syncCalendarForCareShift(
  shift: CareShift,
  createdById: string
) {
  await prisma.calendarEvent.create({
    data: {
      eventType: "care_shift",
      title: "Care shift scheduled",
      startAt: shift.startAt,
      endAt: shift.endAt,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      careShiftId: shift.id,
      createdById,
      visibility: "organisation",
    },
  });
}

export async function syncCalendarForTransport(
  tb: TransportBooking,
  createdById: string
) {
  await prisma.calendarEvent.create({
    data: {
      eventType: "transport_booking",
      title: "Transport trip",
      startAt: tb.pickupWindowStart,
      endAt: tb.pickupWindowEnd ?? tb.pickupWindowStart,
      participantId: tb.participantId,
      transportBookingId: tb.id,
      createdById,
    },
  });
}
