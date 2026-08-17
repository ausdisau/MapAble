import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { disputeServiceForBooking } from "@/lib/payouts/attestation-bridge";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ participantId: user.id }, { createdById: user.id }],
    },
  });
  if (!booking) return jsonError("Booking not found", 404);

  const body = await req.json().catch(() => ({}));
  const attestation = await disputeServiceForBooking({
    bookingId,
    actorUserId: user.id,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  });

  return jsonOk({
    attestation,
    message: "Your concern has been recorded. Payout release is on hold while this is reviewed.",
  });
}
