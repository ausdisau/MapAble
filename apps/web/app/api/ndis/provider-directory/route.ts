import { NextResponse } from "next/server";
import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { searchApprovedOfficialProviderDirectory } from "@/lib/ndis/platform-adapter/official-provider-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Filters = z.object({
  q: z.string().trim().max(80).optional(),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  page: z.coerce.number().int().min(1).max(20).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
}).strict();

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET(request: Request) {
  if (!checkIpRateLimit("official-provider-finder:" + getClientIp(request), {
    windowMs: 60_000, max: 30,
  })) {
    return NextResponse.json({ code: "RATE_LIMITED" }, {
      status: 429, headers: HEADERS,
    });
  }

  const parsed = Filters.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_FILTERS" }, {
      status: 400, headers: HEADERS,
    });
  }

  try {
    const result = await searchApprovedOfficialProviderDirectory(parsed.data);
    if (!result.available) {
      return NextResponse.json({
        code: "OFFICIAL_SNAPSHOT_UNAVAILABLE",
        reason: result.reason,
        officialSource: "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder",
      }, { status: 503, headers: HEADERS });
    }
    return NextResponse.json(result, { headers: HEADERS });
  } catch (error) {
    if (error instanceof Error &&
        error.message === "INVALID_OFFICIAL_PROVIDER_FILTERS") {
      return NextResponse.json({ code: "INVALID_FILTERS" }, {
        status: 400, headers: HEADERS,
      });
    }
    // No raw database errors or sensitive source payloads are exposed.
    return NextResponse.json({ code: "DIRECTORY_READ_UNAVAILABLE" }, {
      status: 503, headers: HEADERS,
    });
  }
}
