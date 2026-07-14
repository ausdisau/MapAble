import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { workerAcceptShiftOffer } from "@/lib/care/shift-offer-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const worker = await requireApiSession();
  if (worker instanceof Response) return worker;
  try {
    const { offerId } = await params;
    return jsonOk(
      await workerAcceptShiftOffer({
        offerId,
        workerUserId: worker.id,
      }),
    );
  } catch {
    return jsonError("Offer is unavailable or already used", 409);
  }
}
