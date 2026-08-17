import type { TripTrackingStatus } from "@prisma/client";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAttestation } from "@/lib/attestations/attestation-service";
import { prisma } from "@/lib/prisma";
import { updateTripStatus } from "@/lib/tracking/trip-tracking-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("tracking:update:driver");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const { status } = await req.json();
  if (!status) return jsonError("status required", 400);

  const result = await updateTripStatus(
    transportBookingId,
    status as TripTrackingStatus,
    user.id
  );

  if (status === "arrived_for_pickup") {
    await createAttestation({
      type: "driver_confirmed_pickup",
      actorUserId: user.id,
      entityType: "TransportBooking",
      entityId: transportBookingId,
      claim: "Driver confirmed pickup",
    });
  }
  if (status === "completed") {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: transportBookingId },
    });
    await createAttestation({
      type: "driver_confirmed_dropoff",
      actorUserId: user.id,
      participantId: tb?.participantId,
      entityType: "TransportBooking",
      entityId: transportBookingId,
      claim: "Driver confirmed drop-off",
    });
  }

  return jsonOk(result);
}
