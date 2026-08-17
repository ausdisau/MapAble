import type { BookingTimelineEventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordBookingTimelineEvent(params: {
  bookingId: string;
  eventType: BookingTimelineEventType;
  title: string;
  description?: string;
  actorUserId?: string;
  isAdminOnly?: boolean;
}) {
  return prisma.bookingTimelineEvent.create({
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      title: params.title,
      description: params.description,
      actorUserId: params.actorUserId,
      isAdminOnly: params.isAdminOnly ?? false,
    },
  });
}

export async function listBookingTimeline(
  bookingId: string,
  includeAdminOnly: boolean
) {
  return prisma.bookingTimelineEvent.findMany({
    where: {
      bookingId,
      ...(includeAdminOnly ? {} : { isAdminOnly: false }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      actor: { select: { id: true, name: true } },
    },
  });
}
