import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { isMapAbleIdReadOnlyEnabled } from "@/lib/identity/mapableid-read-flag";
import { readOwnMapAbleIdSnapshot } from "@/lib/identity/mapableid-read-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request) {
  if (!isMapAbleIdReadOnlyEnabled()) {
    return NextResponse.json({ error: "NOT_FOUND" }, {
      status: 404, headers: PRIVATE_HEADERS,
    });
  }

  const actor = await requireApiSession();
  if (actor instanceof Response) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, {
      status: 401, headers: PRIVATE_HEADERS,
    });
  }

  // This endpoint is ONLY /me, never a client-selectable account query.
  if (new URL(request.url).search) {
    return NextResponse.json({ error: "UNSUPPORTED_FILTERS" }, {
      status: 400, headers: PRIVATE_HEADERS,
    });
  }

  try {
    const snapshot = await readOwnMapAbleIdSnapshot(actor);
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch {
    // Fail closed; do not log or return personal data or database errors.
    return NextResponse.json({ error: "IDENTITY_READ_UNAVAILABLE" }, {
      status: 503, headers: PRIVATE_HEADERS,
    });
  }
}
