import type { ReturnTripAssuranceStatus } from "@prisma/client";

import { transportCommandConfig } from "@/lib/config/transport-command";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";

export async function linkReturnTrip(params: {
  outboundTripId: string;
  returnTripId: string;
  actorUserId: string;
}) {
  if (!transportCommandConfig.commandCentreEnabled) {
    throw new TransportApiError("TRANSPORT_COMMAND_DISABLED");
  }

  const [outbound, returnTrip] = await Promise.all([
    prisma.transportTrip.findUnique({ where: { id: params.outboundTripId } }),
    prisma.transportTrip.findUnique({ where: { id: params.returnTripId } }),
  ]);

  if (!outbound || !returnTrip) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  if (outbound.participantId !== returnTrip.participantId) {
    throw new TransportApiError("TRANSPORT_PARTICIPANT_MISMATCH");
  }

  await prisma.$transaction(async (tx) => {
    await tx.transportTrip.update({
      where: { id: params.outboundTripId },
      data: {
        tripDirection: "outbound",
        returnTripId: params.returnTripId,
        returnAssuranceStatus: "pending",
      } as any,
    });
    await tx.transportTrip.update({
      where: { id: params.returnTripId },
      data: {
        tripDirection: "return",
        outboundTripId: params.outboundTripId,
        returnAssuranceStatus: "pending",
      } as any,
    });

    const existing = await tx.transportReturnTripAssurance.findFirst({
      where: { outboundTripId: params.outboundTripId },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      await tx.transportReturnTripAssurance.update({
        where: { id: existing.id },
        data: {
          returnTripId: params.returnTripId,
          status: "pending",
        },
      });
    } else {
      await tx.transportReturnTripAssurance.create({
        data: {
          outboundTripId: params.outboundTripId,
          returnTripId: params.returnTripId,
          status: "pending",
        },
      });
    }
  });

  await recordTripEvent({
    tripId: params.outboundTripId,
    actorUserId: params.actorUserId,
    eventType: "return_trip_linked",
    message: "Return trip linked — assurance pending",
    participantId: outbound.participantId,
    metadata: { returnTripId: params.returnTripId },
  });

  return getReturnTripAssurance(params.outboundTripId);
}

export async function assureReturnTrip(params: {
  outboundTripId: string;
  actorUserId: string;
  status?: ReturnTripAssuranceStatus;
  notes?: string;
}) {
  if (!transportCommandConfig.commandCentreEnabled) {
    throw new TransportApiError("TRANSPORT_COMMAND_DISABLED");
  }

  const assurance = await prisma.transportReturnTripAssurance.findFirst({
    where: { outboundTripId: params.outboundTripId },
    orderBy: { createdAt: "desc" },
  });
  if (!assurance) {
    throw new TransportApiError("TRANSPORT_RETURN_ASSURANCE_NOT_FOUND");
  }

  const status = params.status ?? "assured";
  const updated = await prisma.transportReturnTripAssurance.update({
    where: { id: assurance.id },
    data: {
      status,
      assuredByUserId: params.actorUserId,
      assuredAt: new Date(),
      notes: params.notes,
    },
  });

  await prisma.transportTrip.updateMany({
    where: {
      OR: [
        { id: params.outboundTripId },
        { id: assurance.returnTripId ?? undefined },
      ],
    },
    data: { returnAssuranceStatus: status },
  });

  return updated;
}

export async function getReturnTripAssurance(outboundTripId: string) {
  const [outbound, assurance, returnTrip] = await Promise.all([
    prisma.transportTrip.findUnique({ where: { id: outboundTripId } }),
    prisma.transportReturnTripAssurance.findFirst({
      where: { outboundTripId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transportTrip.findFirst({
      where: { outboundTripId } as any,
    }),
  ]);

  return {
    outbound,
    returnTrip,
    assurance,
    status: outbound?.returnAssuranceStatus ?? "not_required",
  };
}

export async function flagMissingReturnTrip(outboundTripId: string) {
  await prisma.transportTrip.update({
    where: { id: outboundTripId },
    data: { returnAssuranceStatus: "missing" },
  });

  const assurance = await prisma.transportReturnTripAssurance.findFirst({
    where: { outboundTripId },
    orderBy: { createdAt: "desc" },
  });
  if (assurance) {
    await prisma.transportReturnTripAssurance.update({
      where: { id: assurance.id },
      data: { status: "missing" },
    });
  }

  return { outboundTripId, status: "missing" as const };
}
