import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import {
  recordCareBookingEvent,
  updateCareBookingStatus,
} from "@/lib/care/care-booking-service";
import { createCareShiftFromRequest } from "@/lib/care/care-shift-service";
import {
  assertWorkerEligibleForBooking,
  loadWorkerForEligibility,
} from "@/lib/care/worker-eligibility";
import { prisma } from "@/lib/prisma";

export async function assignWorkerToCareBooking(params: {
  careBookingId: string;
  workerProfileId: string;
  actorUser: CurrentUser;
  startAt?: Date;
  endAt?: Date;
}) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: params.careBookingId },
    include: { careRequest: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(params.actorUser, booking.organisationId);

  const worker = await loadWorkerForEligibility(params.workerProfileId);
  assertWorkerEligibleForBooking(worker, {
    organisationId: booking.organisationId,
    tasks: booking.tasks,
  });

  await prisma.careBookingWorker.upsert({
    where: {
      careBookingId_workerProfileId: {
        careBookingId: params.careBookingId,
        workerProfileId: params.workerProfileId,
      },
    },
    create: {
      careBookingId: params.careBookingId,
      workerProfileId: params.workerProfileId,
      assignedById: params.actorUser.id,
      active: true,
    },
    update: { active: true, assignedById: params.actorUser.id },
  });

  await prisma.careRequest.update({
    where: { id: booking.careRequestId },
    data: {
      assignedWorkerProfileId: params.workerProfileId,
      status: "matched",
    },
  });

  const startAt =
    params.startAt ?? booking.scheduledStartAt ?? new Date();
  const endAt =
    params.endAt ??
    booking.scheduledEndAt ??
    new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  let shift = await prisma.careShift.findFirst({
    where: { careBookingId: booking.id },
  });

  if (!shift) {
    shift = await createCareShiftFromRequest({
      careRequestId: booking.careRequestId,
      careBookingId: booking.id,
      organisationId: booking.organisationId,
      startAt,
      endAt,
      location: booking.location ?? undefined,
      workerProfileId: params.workerProfileId,
      createdById: params.actorUser.id,
    });
  } else {
    shift = await prisma.careShift.update({
      where: { id: shift.id },
      data: {
        workerProfileId: params.workerProfileId,
        status: "worker_assigned",
        careBookingId: booking.id,
      },
    });
  }

  await prisma.careRosterAssignment.create({
    data: {
      careBookingId: booking.id,
      organisationId: booking.organisationId,
      workerProfileId: params.workerProfileId,
      participantId: booking.participantId,
      scheduledDate: startAt,
      notes: "Assigned from care booking",
    },
  });

  await updateCareBookingStatus(
    booking.id,
    "worker_assigned",
    params.actorUser.id,
    "Worker assigned to booking"
  );

  await recordCareBookingEvent({
    careBookingId: booking.id,
    eventType: "worker_assigned",
    title: `Worker ${worker.displayName} assigned`,
    actorUserId: params.actorUser.id,
    metadata: { workerProfileId: params.workerProfileId },
  });

  await createAuditEvent({
    actorUserId: params.actorUser.id,
    action: "care_booking.worker_assigned",
    entityType: "CareBooking",
    entityId: booking.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    metadata: { workerProfileId: params.workerProfileId, shiftId: shift.id },
  });

  return { booking, shift, worker };
}
