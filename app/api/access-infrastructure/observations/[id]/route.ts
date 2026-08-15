import { NextResponse } from "next/server";

import {
  AccessGraphError,
  getAccessObservation,
} from "@/lib/access/infrastructure/observation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/access-infrastructure/observations/[id]
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const observation = await getAccessObservation(id);
    return NextResponse.json({
      framework: "access_as_infrastructure",
      epic: "mapable-epic-01-access-graph",
      productionClaim: "none",
      observation,
    });
  } catch (err) {
    if (err instanceof AccessGraphError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
