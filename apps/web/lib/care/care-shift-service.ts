import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { syncCalendarForCareShift } from "@/lib/calendar/calendar-service";
import { prisma } from "@/lib/prisma";

export async function createCareShiftFromRequest(params: {
  careRequestId: string;
  organisationId: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  workerProfileId?: string;
  careBookingId?: string;
  createdById: string;
  recurringScheduleId?: string;
  occurrenceDate?: Date;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
  });
  if (!request) throw new Error("NOT_FOUND");

  const shift = await prisma.careShift.create({
    data: {
      careRequestId: params.careRequestId,
      careBookingId: params.careBookingId,
      bookingId: request.bookingId,
      participantId: request.participantId,
      organisationId: params.organisationId,
      workerProfileId: params.workerProfileId,
      startAt: params.startAt,
      endAt: params.endAt,
      location: params.location ?? request.address,
      tasks: request.tasks ?? [],
      accessRequirementsSnapshot: request.accessRequirementsSummary
        ? { summary: request.accessRequirementsSummary }
        : {},
      status: params.workerProfileId ? "worker_assigned" : "scheduled",
      recurringScheduleId: params.recurringScheduleId,
      occurrenceDate: params.occurrenceDate,
    },
  });

  await syncCalendarForCareShift(shift, params.createdById);
  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_shift.created",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
  });

  return shift;
}

export async function careShiftCheckIn(shiftId: string, actorUserId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: { status: "checked_in", checkInTime: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_in",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });
  return shift;
}

export async function careShiftCheckOut(shiftId: string, actorUserId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "awaiting_participant_approval",
      checkOutTime: new Date(),
    },
  });

  if (shift.careBookingId) {
    const { ensureServiceLogDraftForShift } = await import(
      "@/lib/care/care-service-log-service"
    );
    await ensureServiceLogDraftForShift(shift.id, actorUserId);
  }

  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_out",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });
  return shift;
}

export async function approveCareShift(shiftId: string, participantId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "approved",
      participantApprovalStatus: "approved",
      approvedById: participantId,
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "care_shift.approved",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });

  if (shift.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: shift.bookingId,
      eventType: "booking_completed",
      title: "Care shift approved by participant",
      actorUserId: participantId,
    });
  }

  return shift;
}
