import {
  canEditPlace,
  canSuggestPlace,
} from "@/lib/access-map/access-place-policy";
import {
  createAccessPlace,
  listPublishedPlaces,
  placeToGeoJsonFeature,
} from "@/lib/access-map/access-place-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAccessPlaceSchema } from "@/types/access-map";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const places = await listPublishedPlaces(200);

  if (format === "geojson") {
    const features = places
      .map(placeToGeoJsonFeature)
      .filter((f): f is NonNullable<typeof f> => f != null);
    return jsonOk({
      type: "FeatureCollection",
      features,
    });
  }

  return jsonOk({
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      suburb: p.suburb,
      stateOrRegion: p.stateOrRegion,
      confidence: p.confidence,
      features: p.features.map((f) => f.type),
      latitude: p.location?.latitude,
      longitude: p.location?.longitude,
      reviewCount: p._count.reviews,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canSuggestPlace(user)) {
    return jsonError("Sign in to suggest a place", 401);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }
  const parsed = createAccessPlaceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = await createAccessPlace({
    input: parsed.data,
    createdById: user.id,
    status: canEditPlace(user) ? "published" : "pending_moderation",
    sourceType: canEditPlace(user) ? "mapable_verified" : "user_suggested",
  });

  return jsonOk({ place: { id: place.id, status: place.status } }, 201);
}
