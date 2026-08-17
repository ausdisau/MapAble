import { NextResponse } from "next/server";
import { z } from "zod";

import { getProviderFinderMapPinLimit } from "@/lib/config/provider-finder-map";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { parseLocationForNdisSearch } from "@/lib/provider/finder/ndis-search-from-applied";

const querySchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  state: z.string().max(8).optional(),
  postcode: z.string().max(16).optional(),
  service: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(2000).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    postcode: searchParams.get("postcode") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { q, location, state, postcode, service, limit } = parsed.data;
  const loc = location ? parseLocationForNdisSearch(location) : {};

  const { providers, count } = await searchNdisProviders({
    q,
    state: state ?? loc.state,
    postcode: postcode ?? loc.postcode,
    service,
    limit: limit ?? getProviderFinderMapPinLimit(),
    withCoordinatesOnly: true,
  });

  const pins = providers.map((p) => ({
    id: p.source_id,
    name: p.provider_name,
    suburb: p.suburb ?? "",
    state: p.state ?? "",
    lat: p.latitude!,
    lng: p.longitude!,
  }));

  return NextResponse.json({
    providers: pins,
    count,
    source: "ndis_providers" as const,
  });
}
