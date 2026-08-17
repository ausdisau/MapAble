import type { CareBookingStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export async function recordCareBookingEvent(params: {
  careBookingId: string;
  eventType: string;
  title: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.careBookingEvent.create({
    data: {
      careBookingId: params.careBookingId,
      eventType: params.eventType,
      title: params.title,
      actorUserId: params.actorUserId,
      metadata: params.metadata as object | undefined,
    },
  });
}

export async function createCareBookingFromRequest(params: {
  careRequestId: string;
  organisationId: string;
  actorUserId: string;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
  });
  if (!request) throw new Error("NOT_FOUND");
  if (request.assignedOrganisationId !== params.organisationId) {
    throw new Error("ORG_MISMATCH");
  }

  const startAt = request.preferredDate ?? new Date();
  const endAt = request.endTime
    ? new Date(startAt.getTime() + 2 * 60 * 60 * 1000)
    : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  const existing = await prisma.careBooking.findUnique({
    where: { careRequestId: params.careRequestId },
  });
  if (existing) return existing;

  const booking = await prisma.careBooking.create({
    data: {
      careRequestId: params.careRequestId,
      participantId: request.participantId,
      organisationId: params.organisationId,
      status: "accepted",
      scheduledStartAt: startAt,
      scheduledEndAt: endAt,
      location: request.address ?? undefined,
      tasks: request.tasks ?? [],
    },
  });

  await prisma.careServiceAgreement.create({
    data: {
      careBookingId: booking.id,
      placeholderTitle: "Service agreement (placeholder)",
      placeholderSummary:
        "Review and sign your service agreement with your provider before services begin.",
      status: "placeholder",
    },
  });

  await recordCareBookingEvent({
    careBookingId: booking.id,
    eventType: "booking_accepted",
    title: "Provider accepted care booking",
    actorUserId: params.actorUserId,
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_booking.created",
    entityType: "CareBooking",
    entityId: booking.id,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
  });

  return booking;
}

export async function updateCareBookingStatus(
  careBookingId: string,
  status: CareBookingStatus,
  actorUserId: string,
  eventTitle: string
) {
  const booking = await prisma.careBooking.update({
    where: { id: careBookingId },
    data: { status },
  });

  await recordCareBookingEvent({
    careBookingId,
    eventType: `status_${status}`,
    title: eventTitle,
    actorUserId,
  });

  await createAuditEvent({
    actorUserId,
    action: "care_booking.status_changed",
    entityType: "CareBooking",
    entityId: careBookingId,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
    metadata: { status },
  });

  return booking;
}

export async function providerAcceptCareBooking(
  careBookingId: string,
  user: CurrentUser
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
    include: { careRequest: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(user, booking.organisationId);

  const updated = await updateCareBookingStatus(
    careBookingId,
    "accepted",
    user.id,
    "Booking accepted by provider"
  );

  await prisma.careRequest.update({
    where: { id: booking.careRequestId },
    data: { status: "confirmed" },
  });

  return updated;
}

export async function providerDeclineCareBooking(
  careBookingId: string,
  user: CurrentUser,
  reason?: string
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(user, booking.organisationId);

  const updated = await updateCareBookingStatus(
    careBookingId,
    "declined",
    user.id,
    "Booking declined by provider"
  );

  await recordCareBookingEvent({
    careBookingId,
    eventType: "booking_declined",
    title: reason ?? "Provider declined",
    actorUserId: user.id,
    metadata: reason ? { reason } : undefined,
  });

  await prisma.careRequest.update({
    where: { id: booking.careRequestId },
    data: { status: "cancelled" },
  });

  return updated;
}

export async function getCareBookingForUser(
  careBookingId: string,
  user: CurrentUser
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
    include: {
      careRequest: true,
      organisation: { select: { id: true, name: true } },
      bookingWorkers: { include: { workerProfile: true } },
      serviceLogs: { orderBy: { createdAt: "desc" } },
      serviceAgreement: true,
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      shifts: true,
    },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const { assertProviderOrgAccess } = await import("@/lib/care/access-control");
  const { isAdminRole } = await import("@/lib/auth/roles");

  if (isAdminRole(user.primaryRole)) return booking;
  if (booking.participantId === user.id) return booking;
  try {
    await assertProviderOrgAccess(user, booking.organisationId);
    return booking;
  } catch {
    /* worker may view assigned shift booking via shift route */
  }

  const workerShift = booking.shifts.find(
    (s) => s.workerProfileId && user.primaryRole === "support_worker"
  );
  if (workerShift) {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId: user.id, id: workerShift.workerProfileId ?? "" },
    });
    if (profile) return booking;
  }

  throw new Error("FORBIDDEN");
}
