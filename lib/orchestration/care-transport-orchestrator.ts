import { phase3Config } from "@/lib/config/phase3";
import {
  CARE_TRANSPORT_PICKUP_BUFFER_MINUTES,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import { requireMicroConsent } from "@/lib/consent/micro-consent-service";
import { prisma } from "@/lib/prisma";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";

export type UnifiedCareTransportState = {
  careRequestId: string;
  transportBookingId: string | null;
  transportStatus: string | null;
  careRequestStatus: string;
  pickupWindowStart: Date | null;
  linked: boolean;
};

function isOrchestrationV2Enabled() {
  return (
    y2OrchestrationConfig.careTransportOrchestrationV2Enabled &&
    phase3Config.orchestrationEnabled
  );
}

export async function createLinkedTransportFromCareRequest(
  careRequestId: string,
  actorUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true, reason: "Orchestration disabled" };
  }

  const key = `care-transport-${careRequestId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing?.transportBookingId) {
    return { duplicate: true, transportBookingId: existing.transportBookingId };
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      participant: {
        include: { participantProfile: true },
      },
    },
  });
  if (!request || !request.linkedTransportRequired) {
    throw new Error("LINK_NOT_REQUESTED");
  }

  if (isOrchestrationV2Enabled()) {
    await requireMicroConsent({
      action: "orchestration.share_transport",
      subjectUserId: request.participantId,
      actorUserId,
    });
    await requireMicroConsent({
      action: "orchestration.share_care_location",
      subjectUserId: request.participantId,
      actorUserId,
    });
  }

  const shiftStart = request.preferredDate ?? new Date();
  const pickupStart = isOrchestrationV2Enabled()
    ? new Date(
        shiftStart.getTime() - CARE_TRANSPORT_PICKUP_BUFFER_MINUTES * 60 * 1000
      )
    : shiftStart;

  const homeAddress =
    request.participant.participantProfile?.homeSuburb ??
    request.address ??
    "Address to be confirmed";
  const careAddress = request.address ?? homeAddress;

  const tb = await createTransportBooking({
    participantId: request.participantId,
    pickupAddress: homeAddress,
    dropoffAddress: careAddress,
    pickupWindowStart: pickupStart,
    shareAccessibility: request.shareAccessibility,
    shareAccessibilityConfirmed: request.shareAccessibility,
    pickupNotes: isOrchestrationV2Enabled()
      ? `Linked to care request (${CARE_TRANSPORT_PICKUP_BUFFER_MINUTES}min buffer)`
      : "Linked to care request",
    careRequestId,
    status: "draft",
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "care_transport_link_created",
      careRequestId,
      transportBookingId: tb.id,
      idempotencyKey: key,
      createdById: actorUserId,
      metadata: {
        careRequestId,
        pickupBufferMinutes: isOrchestrationV2Enabled()
          ? CARE_TRANSPORT_PICKUP_BUFFER_MINUTES
          : 0,
      },
    },
  });

  return { transportBooking: tb };
}

export async function getUnifiedCareTransportState(
  careRequestId: string
): Promise<UnifiedCareTransportState | null> {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) return null;

  const event = await prisma.orchestrationEvent.findFirst({
    where: { careRequestId, eventType: "care_transport_link_created" },
    orderBy: { createdAt: "desc" },
  });

  let transportStatus: string | null = null;
  if (event?.transportBookingId) {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: event.transportBookingId },
    });
    transportStatus = tb?.status ?? null;
  }

  return {
    careRequestId,
    transportBookingId: event?.transportBookingId ?? null,
    transportStatus,
    careRequestStatus: request.status,
    pickupWindowStart: request.preferredDate,
    linked: Boolean(event?.transportBookingId),
  };
}

export async function propagateCareShiftStatusToTransport(params: {
  careShiftId: string;
  newStatus: string;
  actorUserId: string;
}) {
  if (!isOrchestrationV2Enabled()) return { skipped: true };

  const shift = await prisma.careShift.findUnique({
    where: { id: params.careShiftId },
    include: { careRequest: true },
  });
  if (!shift?.careRequestId) return { skipped: true };

  const event = await prisma.orchestrationEvent.findFirst({
    where: {
      careRequestId: shift.careRequestId,
      transportBookingId: { not: null },
    },
  });
  if (!event?.transportBookingId) return { skipped: true };

  if (params.newStatus === "cancelled") {
    await prisma.transportBooking.update({
      where: { id: event.transportBookingId },
      data: { status: "cancelled" },
    });
    await prisma.orchestrationEvent.create({
      data: {
        eventType: "care_transport_cancel_propagated",
        careRequestId: shift.careRequestId,
        transportBookingId: event.transportBookingId,
        idempotencyKey: `cancel-${shift.id}-${Date.now()}`,
        createdById: params.actorUserId,
        metadata: { careShiftId: shift.id },
      },
    });
  }

  return { propagated: true, transportBookingId: event.transportBookingId };
}

export async function requestOrchestrationReschedule(params: {
  careRequestId?: string;
  careShiftId?: string;
  transportBookingId?: string;
  requestedById: string;
  notes?: string;
}) {
  if (!isOrchestrationV2Enabled()) {
    throw new Error("ORCHESTRATION_V2_DISABLED");
  }

  return prisma.orchestrationRescheduleRequest.create({
    data: {
      careRequestId: params.careRequestId,
      careShiftId: params.careShiftId,
      transportBookingId: params.transportBookingId,
      requestedById: params.requestedById,
      notes: params.notes,
      status: "pending",
    },
  });
}

export async function listPendingRescheduleRequests(_coordinatorId?: string) {
  return prisma.orchestrationRescheduleRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
