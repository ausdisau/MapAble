import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export async function getOperatorDispatchBoard() {
  if (!phase7Config.operatorDispatchEnabled) return { disabled: true };

  const transports = await prisma.transportBooking.findMany({
    where: {
      status: {
        in: [
          "confirmed",
          "driver_en_route",
          "arrived_for_pickup",
          "participant_on_board",
          "in_transit",
        ],
      },
    },
    take: 40,
    include: { driverProfile: true, vehicle: true },
  });

  const boards = [];
  for (const t of transports) {
    const board = await prisma.operatorDispatchBoard.upsert({
      where: { transportBookingId: t.id },
      create: {
        transportBookingId: t.id,
        assignedDriverId: t.driverProfileId,
        status: "active",
      },
      update: { assignedDriverId: t.driverProfileId },
    });
    boards.push({ board, transport: t });
  }
  return { boards };
}

export async function reassignDriver(params: {
  boardId: string;
  toDriverId: string;
  reason: string;
  actorUserId: string;
}) {
  const board = await prisma.operatorDispatchBoard.findUnique({
    where: { id: params.boardId },
  });
  if (!board) throw new Error("NOT_FOUND");

  await prisma.dispatchReassignment.create({
    data: {
      boardId: params.boardId,
      fromDriverId: board.assignedDriverId,
      toDriverId: params.toDriverId,
      reason: params.reason,
      actorUserId: params.actorUserId,
    },
  });

  await prisma.operatorDispatchBoard.update({
    where: { id: params.boardId },
    data: { assignedDriverId: params.toDriverId },
  });

  if (board.transportBookingId) {
    await prisma.transportBooking.update({
      where: { id: board.transportBookingId },
      data: { driverProfileId: params.toDriverId },
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "operator_dispatch.reassigned",
    entityType: "OperatorDispatchBoard",
    entityId: params.boardId,
  });

  return board;
}

export async function resolveCancellation(params: {
  transportBookingId?: string;
  careShiftId?: string;
  reason: string;
  resolution: string;
  actorUserId: string;
}) {
  return prisma.cancellationResolution.create({
    data: { ...params, status: "resolved" },
  });
}
