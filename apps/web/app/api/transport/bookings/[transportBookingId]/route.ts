import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  TransportApiError,
  transportErrorResponse,
} from "@/lib/transport/transport-api-error";
import { assertCanAccessTransportBooking } from "@/lib/transport/transport-booking-access";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  const existing = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!existing) return jsonError("Not found", 404);

  try {
    await assertCanAccessTransportBooking(user, existing);
  } catch (e) {
    if (e instanceof TransportApiError) {
      return transportErrorResponse(e);
    }
    throw e;
  }

  const body = await req.json();
  const booking = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      pickupNotes: body.pickupNotes,
      dropoffNotes: body.dropoffNotes,
      status: body.status,
    },
  });
  return jsonOk({ booking });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { vehicle: true, driverProfile: true, operatorOrganisation: true },
  });
  if (!booking) return jsonError("Not found", 404);

  try {
    await assertCanAccessTransportBooking(user, booking);
  } catch (e) {
    if (e instanceof TransportApiError) {
      return transportErrorResponse(e);
    }
    throw e;
  }

  const reqs = (booking.vehicleRequirements ?? {}) as Record<string, boolean>;
  const warnings = getVehicleSuitabilityWarnings(
    {
      requiresWheelchairAccessible: reqs.requiresWheelchairAccessible,
      requiresRamp: reqs.requiresRamp,
      requiresLift: reqs.requiresLift,
      assistanceAnimal: reqs.assistanceAnimal,
    },
    booking.vehicle
  );

  return jsonOk({ booking, vehicleSuitabilityWarnings: warnings });
}
