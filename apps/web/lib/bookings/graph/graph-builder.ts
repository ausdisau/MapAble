import type { BookingGraphEntityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function upsertNode(
  entityType: BookingGraphEntityType,
  entityId: string,
  label?: string
) {
  return prisma.bookingGraphNode.upsert({
    where: {
      entityType_entityId: { entityType, entityId },
    },
    create: { entityType, entityId, label },
    update: { label },
  });
}

export async function buildBookingGraphForCareRequest(careRequestId: string) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      shifts: true,
      careBooking: true,
    },
  });
  if (!request) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  for (const shift of request.shifts) {
    const node = await upsertNode(
      "care_shift",
      shift.id,
      `Care shift ${shift.startAt.toISOString()}`
    );
    nodes.push(node);
  }

  const transportBookings = await prisma.transportBooking.findMany({
    where: {
      OR: [
        { careRequestId },
        {
          careShiftId: { in: request.shifts.map((s) => s.id) },
        },
      ],
    },
  });

  for (const tb of transportBookings) {
    const tNode = await upsertNode(
      "transport_booking",
      tb.id,
      `Transport ${tb.pickupAddress}`
    );
    nodes.push(tNode);

    if (tb.careShiftId) {
      const shiftNode = nodes.find(
        (n) => n.entityType === "care_shift" && n.entityId === tb.careShiftId
      );
      if (shiftNode) {
        const edge = await prisma.bookingGraphEdge.create({
          data: {
            fromNodeId: tNode.id,
            toNodeId: shiftNode.id,
            dependencyType: "must_finish_before",
            bufferMinutes: 15,
            notes: "Transport should complete before care shift ends",
          },
        });
        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}
