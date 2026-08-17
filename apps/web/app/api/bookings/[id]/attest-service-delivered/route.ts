import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { attestServiceDelivered } from "@/lib/payouts/attestation-bridge";
import { prisma } from "@/lib/prisma";

async function assertBookingAccess(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { participantId: userId },
        { createdById: userId },
        { assignedWorkerId: userId },
      ],
    },
  });
  return booking;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id: bookingId } = await params;

  const booking = await assertBookingAccess(bookingId, user.id);
  if (!booking) return jsonError("Booking not found", 404);

  const body = await req.json().catch(() => ({}));
  const attestation = await attestServiceDelivered({
    bookingId,
    actorUserId: user.id,
    claimType: "service_delivered",
    evidence: typeof body === "object" && body ? (body as Record<string, unknown>) : undefined,
  });

  return jsonOk({ attestation });
}
