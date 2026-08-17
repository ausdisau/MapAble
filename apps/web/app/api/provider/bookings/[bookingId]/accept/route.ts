import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { providerAcceptBooking } from "@/lib/bookings/provider-response";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { bookingId } = await params;
  const { note, organisationId } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking?.assignedOrganisationId) {
    return jsonError("Booking not assigned", 400);
  }

  const member = await prisma.organisationMember.findFirst({
    where: {
      userId: user.id,
      organisationId: organisationId ?? booking.assignedOrganisationId,
    },
  });
  if (!member) return jsonError("Forbidden", 403);

  const updated = await providerAcceptBooking(
    bookingId,
    booking.assignedOrganisationId,
    user.id,
    note
  );
  return jsonOk({ booking: updated });
}
