import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { createTransportBookingSchema } from "@/lib/validation/transport";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = isAdminRole(user.primaryRole)
    ? {}
    : user.primaryRole === "transport_operator" ||
        user.primaryRole === "driver"
      ? {}
      : { participantId: user.id };

  const bookings = await prisma.transportBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { vehicle: true, driverProfile: true },
  });
  return jsonOk({ bookings });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;

  try {
    const parsed = createTransportBookingSchema.parse(await req.json());
    const booking = await createTransportBooking({
      participantId: user.id,
      pickupAddress: parsed.pickupAddress,
      dropoffAddress: parsed.dropoffAddress,
      pickupWindowStart: new Date(parsed.pickupWindowStart),
      pickupWindowEnd: parsed.pickupWindowEnd
        ? new Date(parsed.pickupWindowEnd)
        : undefined,
      mobilityAidSnapshot: parsed.mobilityAidSnapshot,
      vehicleRequirements: parsed.vehicleRequirements,
      shareAccessibility: parsed.shareAccessibility,
      shareAccessibilityConfirmed: parsed.shareAccessibilityConfirmed,
      driverAssistanceRequired: parsed.driverAssistanceRequired,
      pickupNotes: parsed.pickupNotes,
      dropoffNotes: parsed.dropoffNotes,
      careRequestId: parsed.careRequestId,
    });
    return jsonOk({ booking }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError("Consent required for accessibility sharing", 403);
    }
    return jsonError("Create failed", 500);
  }
}
