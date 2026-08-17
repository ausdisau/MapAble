import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { confirmServiceForBooking } from "@/lib/payouts/attestation-bridge";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, participantId: user.id },
  });
  if (!booking) return jsonError("Booking not found", 404);

  const attestation = await confirmServiceForBooking({
    bookingId,
    actorUserId: user.id,
  });

  return jsonOk({
    attestation,
    message:
      "Service confirmed. This may allow payment to be released to the worker or provider after review.",
  });
}
