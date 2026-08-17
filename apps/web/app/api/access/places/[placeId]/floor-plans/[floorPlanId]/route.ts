import { getVenueFloorPlanDetail } from "@/lib/access/floor-plan/floor-plan-service";
import { jsonError, jsonOk } from "@/lib/api/response";

type RouteParams = { params: Promise<{ placeId: string; floorPlanId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { placeId, floorPlanId } = await params;
  const result = await getVenueFloorPlanDetail(placeId, floorPlanId);
  if (!result) return jsonError("Floor plan not found", 404);
  return jsonOk(result);
}
