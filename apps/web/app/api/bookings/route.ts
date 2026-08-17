import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createBooking } from "@/lib/bookings/booking-service";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validation/booking";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = isAdminRole(user.primaryRole)
    ? { ...(status ? { status: status as never } : {}) }
    : { participantId: user.id, ...(status ? { status: status as never } : {}) };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return jsonOk({ bookings });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createBookingSchema.parse(await req.json());
    const booking = await createBooking({
      ...parsed,
      participantId: user.id,
      createdById: user.id,
    });
    return jsonOk({ booking }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(
        "Consent is required before sharing accessibility details with a provider",
        403
      );
    }
    return jsonError("Create failed", 500);
  }
}
