import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { queryAccessEvidenceGraph } from "@/lib/careos/opportunities/access-evidence-graph";

export async function GET(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  try {
    const graph = await queryAccessEvidenceGraph({
      placeId: url.searchParams.get("placeId") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      take: url.searchParams.get("take")
        ? Number(url.searchParams.get("take"))
        : undefined,
    });
    return NextResponse.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GRAPH_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
