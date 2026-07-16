import { jsonError, jsonOk } from "@/lib/api/response";
import { listVenueFloorPlans } from "@/lib/floor-plan/floor-plan-service";
import { getDemoPlaceBySlug } from "@/lib/demo/accessibility-places";
import {
  demoVenueHasFloorPlan,
  getDemoFloorPlanSummaries,
} from "@/lib/demo/floor-plan-fixture";

type RouteParams = { params: Promise<{ placeId: string }> };

/** Resolve venue id from placeId param (supports demo slug lookup via query). */
async function resolveVenueId(placeId: string, slug?: string | null): Promise<{ id: string; name: string } | null> {
  if (demoVenueHasFloorPlan(placeId)) {
    const demo = getDemoFloorPlanSummaries(placeId);
    if (demo) return { id: placeId, name: demo.venueName };
  }
  if (slug) {
    const bySlug = getDemoPlaceBySlug(slug);
    if (bySlug && demoVenueHasFloorPlan(bySlug.id)) {
      return { id: bySlug.id, name: bySlug.name };
    }
  }
  return null;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { placeId } = await params;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  const demoVenue = await resolveVenueId(placeId, slug);
  if (demoVenue) {
    const result = await listVenueFloorPlans(demoVenue.id, demoVenue.name);
    if (!result) return jsonError("Floor plans not found", 404);
    return jsonOk(result);
  }

  const result = await listVenueFloorPlans(placeId);
  if (!result) return jsonError("Venue not found", 404);
  return jsonOk(result);
}
