import { createHash } from "crypto";

import { assertOrganisationAccess } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { assertWorkerEvidenceEligible } from "@/lib/care/worker-eligibility";
import { providerWorkforceConfig } from "@/lib/config/provider-workforce";
import { prisma } from "@/lib/prisma";

function dayName(date: Date) {
  return date
    .toLocaleDateString("en-AU", {
      weekday: "long",
      timeZone: "Australia/Sydney",
    })
    .toUpperCase();
}

function timeValue(date: Date) {
  return date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Sydney",
  });
}

export async function checkWorkerAvailability(input: {
  workerProfileId: string;
  startAt: Date;
  endAt: Date;
  excludeShiftId?: string;
}) {
  if (
    !providerWorkforceConfig.providerCloudEnabled ||
    !providerWorkforceConfig.workerMatchingEnabled ||
    providerWorkforceConfig.automaticAssignmentEnabled
  ) {
    throw new Error("WORKER_MATCHING_DISABLED");
  }
  const [window, conflict] = await Promise.all([
    prisma.availabilityWindow.findFirst({
      where: {
        workerProfileId: input.workerProfileId,
        active: true,
        dayOfWeek: dayName(input.startAt) as
          | "MONDAY"
          | "TUESDAY"
          | "WEDNESDAY"
          | "THURSDAY"
          | "FRIDAY"
          | "SATURDAY"
          | "SUNDAY",
        startTime: { lte: timeValue(input.startAt) },
        endTime: { gte: timeValue(input.endAt) },
        effectiveFrom: { lte: input.startAt },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: input.endAt } }],
      },
    }),
    prisma.careShift.findFirst({
      where: {
        workerProfileId: input.workerProfileId,
        id: input.excludeShiftId ? { not: input.excludeShiftId } : undefined,
        status: { notIn: ["cancelled", "completed"] },
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
      },
    }),
  ]);
  return {
    available: Boolean(window) && !conflict,
    reasonCodes: [
      ...(!window ? ["WORKER_AVAILABILITY_MISSING"] : []),
      ...(conflict ? ["WORKER_SCHEDULING_CONFLICT"] : []),
    ],
  };
}

export async function createShiftOffer(input: {
  actor: CurrentUser;
  careShiftId: string;
  workerProfileId: string;
  idempotencyKey: string;
  requiredCredentialTypes: string[];
  expiresAt: Date;
}) {
  const shift = await prisma.careShift.findUnique({
    where: { id: input.careShiftId },
  });
  if (!shift) throw new Error("SHIFT_NOT_FOUND");
  await assertOrganisationAccess(
    input.actor,
    shift.organisationId,
    "care:manage:org",
  );
  await assertWorkerEvidenceEligible(
    input.workerProfileId,
    input.requiredCredentialTypes,
  );
  const availability = await checkWorkerAvailability({
    workerProfileId: input.workerProfileId,
    startAt: shift.startAt,
    endAt: shift.endAt,
    excludeShiftId: shift.id,
  });
  if (!availability.available) {
    throw new Error(availability.reasonCodes[0] ?? "WORKER_UNAVAILABLE");
  }
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        careShiftId: shift.id,
        workerProfileId: input.workerProfileId,
        participantId: shift.participantId,
        missionId: shift.missionId,
      }),
    )
    .digest("hex");
  const offer = await prisma.shiftOffer.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      careShiftId: shift.id,
      workerProfileId: input.workerProfileId,
      participantId: shift.participantId,
      missionId: shift.missionId,
      payloadHash,
      idempotencyKey: input.idempotencyKey,
      expiresAt: input.expiresAt,
    },
    update: {},
  });
  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: input.actor.primaryRole,
    participantId: shift.participantId,
    organisationId: shift.organisationId,
    action: "care.shift_offer.created",
    entityType: "ShiftOffer",
    entityId: offer.id,
    metadata: {
      missionId: shift.missionId,
      workerProfileId: input.workerProfileId,
    },
  });
  return offer;
}

export async function participantConfirmShiftOffer(input: {
  offerId: string;
  participantId: string;
}) {
  const result = await prisma.shiftOffer.updateMany({
    where: {
      id: input.offerId,
      participantId: input.participantId,
      status: "awaiting_participant",
      expiresAt: { gt: new Date() },
    },
    data: {
      status: "awaiting_worker",
      participantConfirmedAt: new Date(),
    },
  });
  if (result.count !== 1) throw new Error("SHIFT_OFFER_CONFIRMATION_INVALID");
  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "care.shift_offer.participant_confirmed",
    entityType: "ShiftOffer",
    entityId: input.offerId,
  });
}

export async function workerAcceptShiftOffer(input: {
  offerId: string;
  workerUserId: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const offer = await tx.shiftOffer.findFirst({
      where: {
        id: input.offerId,
        status: "awaiting_worker",
        expiresAt: { gt: new Date() },
        workerProfile: { userId: input.workerUserId, active: true },
      },
      include: { careShift: true },
    });
    if (!offer) throw new Error("SHIFT_OFFER_ACCEPTANCE_INVALID");
    const claimed = await tx.shiftOffer.updateMany({
      where: { id: offer.id, status: "awaiting_worker" },
      data: { status: "accepted", workerRespondedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("SHIFT_OFFER_ALREADY_USED");
    const shift = await tx.careShift.update({
      where: { id: offer.careShiftId },
      data: {
        workerProfileId: offer.workerProfileId,
        status: "worker_assigned",
        workerAcceptanceStatus: "accepted",
        participantApprovalStatus: "approved",
      },
    });
    return { offerId: offer.id, shift };
  });
  await createAuditEvent({
    actorUserId: input.workerUserId,
    participantId: result.shift.participantId,
    organisationId: result.shift.organisationId,
    action: "care.shift_offer.worker_accepted",
    entityType: "ShiftOffer",
    entityId: input.offerId,
    metadata: {
      careShiftId: result.shift.id,
      missionId: result.shift.missionId,
    },
  });
  return result;
}
