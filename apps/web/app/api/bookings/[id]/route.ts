import { ZodError } from "zod";

import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { updateBooking } from "@/lib/bookings/booking-service";
import { prisma } from "@/lib/prisma";
import { updateBookingSchema } from "@/lib/validation/booking";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: true,
    },
  });

  if (!booking) return jsonError("Not found", 404);
  if (
    !isAdminRole(user.primaryRole) &&
    booking.participantId !== user.id
  ) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ booking });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const parsed = updateBookingSchema.parse(await req.json());
    const booking = await updateBooking(id, parsed, user.id);
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
