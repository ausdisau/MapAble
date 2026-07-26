import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  draftInfrastructureFromDescription,
  infrastructureDraftRequestSchema,
} from "@/lib/transport/care-map/infrastructure-draft";
import { isAddInfrastructureEnabled } from "@/lib/config/care-transport-map";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { forwardGeocodeAustralia } from "@/lib/map/nominatim-server";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";
import { accessPlaceCategorySchema } from "@/types/access-map";

const gptDraftSchema = z.object({
  name: z.string().min(2).max(200),
  category: accessPlaceCategorySchema,
  addressText: z.string().max(500).optional(),
  suburb: z.string().max(120).optional(),
  stateOrRegion: z.string().max(80).optional(),
  description: z.string().max(5000).optional(),
  geocodeQuery: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  if (!isAddInfrastructureEnabled()) {
    return NextResponse.json(
      {
        error: "Add infrastructure is not enabled",
        code: "FEATURE_DISABLED",
      },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = infrastructureDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Describe the place in a short paragraph (8+ characters)." },
      { status: 400 },
    );
  }

  let draft = draftInfrastructureFromDescription(parsed.data.description);
  let engine: "heuristic" | "gpt" = "heuristic";

  if (isSearchInterpreterConfigured()) {
    try {
      const { object } = await generateObject({
        model: getInterpreterModel(),
        schema: gptDraftSchema,
        prompt: [
          "Extract a moderated Care or Transport infrastructure place suggestion for MapAble (Australia).",
          "Prefer categories: care_support_hub, accessible_pickup_point, transport_depot, transport_station, health_service, community_centre.",
          "Do not invent precise coordinates. Provide suburb/state and a geocodeQuery string when possible.",
          "User description:",
          parsed.data.description,
        ].join("\n"),
      });
      draft = {
        ...draft,
        ...object,
        description: object.description ?? parsed.data.description,
      };
      engine = "gpt";
    } catch {
      // Keep heuristic draft when GPT is unavailable.
    }
  }

  const geocodeQuery =
    draft.geocodeQuery ||
    [draft.addressText, draft.suburb, draft.stateOrRegion, "Australia"]
      .filter(Boolean)
      .join(", ");

  let latitude = draft.latitude;
  let longitude = draft.longitude;
  let geocoded = false;

  if (
    (latitude == null || longitude == null) &&
    geocodeQuery.trim().length > 0
  ) {
    const coords = await forwardGeocodeAustralia(geocodeQuery);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
      geocoded = true;
    }
  }

  return NextResponse.json({
    draft: {
      ...draft,
      latitude,
      longitude,
      geocodeQuery,
    },
    meta: {
      engine,
      geocoded,
      honesty:
        "Draft only. Review before submitting. Suggestions are moderated and are not written to OpenStreetMap.org.",
    },
  });
}
