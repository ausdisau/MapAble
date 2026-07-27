import { listAccessiblePlaces } from "@/lib/accessibility-map/place-service";
import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    { requiredScope: "places_read" },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          places: [
            {
              id: "place_sandbox_001",
              name: "Sandbox Accessible Venue",
              confidence: "medium",
              features: ["step_free_entry"],
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const places = await listAccessiblePlaces(limit + 1);
      const safe = places.map((p) => ({
        id: p.id,
        name: p.name,
        confidence: p.confidence,
        features: p.features.map((f) => f.type),
        createdAt: p.createdAt,
      }));
      const page = buildCursorPage(safe, limit);
      return apiSuccessResponse({ places: page.items, page });
    },
  );
}
