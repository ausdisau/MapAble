import { z } from "zod";

import { checkIpRateLimit } from "@/lib/api/ip-rate-limit";
import { getApiUser } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { searchPublishedNdisDirectory } from "@/lib/ndis/published-directory-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Filters = z.object({
  name: z.string().max(80).optional(),
  state: z.enum(["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  registrationGroup: z.string().max(160).optional(),
  limit: z.coerce.number().int().min(1).max(25).optional(),
}).strict();
/** Read-only admin QA endpoint. Future public release requires separate authorisation. */
export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user || !isAdminRole(user.primaryRole)) {
    return Response.json({ ok: false, code: "ADMIN_REQUIRED" }, { status: 403 });
  }
  if (process.env.NDIS_DIRECTORY_PUBLISHED_SEARCH_ENABLED !== "true") {
    return Response.json({ ok: false, code: "DIRECTORY_SEARCH_DISABLED" }, { status: 404 });
  }
  if (!checkIpRateLimit("ndia-published-search:"+user.id, {
    windowMs: 60_000, max: 30,
  })) return Response.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
  const p = new URL(request.url).searchParams;
  const parsed = Filters.safeParse(Object.fromEntries(p));
  if (!parsed.success) {
    return Response.json({ ok: false, code: "INVALID_SEARCH" }, { status: 400 });
  }
  try {
    const result = await searchPublishedNdisDirectory(parsed.data);
    return Response.json({ ok: true, result }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ ok: false, code: "PUBLISHED_DIRECTORY_UNAVAILABLE" }, {
      status: 503,
    });
  }
}
