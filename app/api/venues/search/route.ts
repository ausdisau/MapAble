import { NextResponse } from "next/server";

import { getAccessMapPlaces } from "@/lib/access-map/access-map-places";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { filterDemoPlaces } from "@/lib/demo/accessibility-places";
import { toPublicVenueSpec } from "@/lib/offline/public-venue-dto";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const MAX_RESULTS = 200;

/**
 * Public venue accessibility search for offline/PWA caching.
 * Returns minimised, non-sensitive demo/public access facts only.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return NextResponse.json(
      { error: "Too many search requests. Please wait and try again." },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const suburb = url.searchParams.get("suburb") ?? "";
  const filters = (url.searchParams.get("filters") ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const allPlaces = await getAccessMapPlaces();
  const places = filterDemoPlaces(allPlaces, {
    query,
    suburb,
    filters,
  }).slice(0, MAX_RESULTS);

  return NextResponse.json(
    {
      venues: places.map(toPublicVenueSpec),
      count: places.length,
      cachedAt: new Date().toISOString(),
      source: "access-map-public",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
