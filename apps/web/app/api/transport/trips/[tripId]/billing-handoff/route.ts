import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { handoffTransportTripToBilling } from "@/lib/orchestration/orchestration-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const user = await requireApiPermission("transport:manage:org");
  if (isResponse(user)) return user;
  const { tripId } = await params;
  try {
    const result = await handoffTransportTripToBilling({
      tripId,
      actor: user,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "TRIP_NOT_COMPLETE") {
      return jsonError("Trip is not in a billable completed state", 400);
    }
    if (e instanceof Error && e.message === "ORG_REQUIRED") {
      return jsonError("Trip missing provider organisation", 400);
    }
    return jsonError("Forbidden", 403);
  }
}
