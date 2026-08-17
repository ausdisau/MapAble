import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createLinkedTransportFromCareRequest,
  requestOrchestrationReschedule,
} from "@/lib/orchestration/care-transport-orchestrator";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();

  if (body.action === "reschedule_request") {
    const request = await requestOrchestrationReschedule({
      careRequestId: body.careRequestId,
      careShiftId: body.careShiftId,
      transportBookingId: body.transportBookingId,
      requestedById: user.id,
      notes: body.notes,
    });
    return jsonOk({ request }, 201);
  }

  if (!body.careRequestId) {
    return jsonError("careRequestId required", 400);
  }

  const result = await createLinkedTransportFromCareRequest(
    body.careRequestId,
    user.id
  );
  return jsonOk(result, 201);
}
