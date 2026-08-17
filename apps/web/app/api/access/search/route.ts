import { searchAccessPlaces } from "@/lib/access/map/access-search-service";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessSearchQuerySchema } from "@/types/access-map";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = accessSearchQuerySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const results = await searchAccessPlaces(parsed.data);

  return jsonOk({
    results: results.map((r) => ({
      place: {
        id: r.place.id,
        name: r.place.name,
        category: r.place.category,
        suburb: r.place.suburb,
        confidence: r.place.confidence,
        latitude: r.place.location?.latitude,
        longitude: r.place.location?.longitude,
        reviewCount: r.place._count.reviews,
        accreditationTier: r.place.accreditationAssessments[0]?.tier ?? null,
      },
      matchReasons: r.matchReasons,
    })),
  });
}
