import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { participantConfirmShiftOffer } from "@/lib/care/shift-offer-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  try {
    const { offerId } = await params;
    await participantConfirmShiftOffer({
      offerId,
      participantId: participant.id,
    });
    return jsonOk({ confirmed: true });
  } catch {
    return jsonError("Confirmation is unavailable", 409);
  }
}
