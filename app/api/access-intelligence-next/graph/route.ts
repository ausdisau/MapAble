import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  getHarbourGraph,
  projectEdgesToList,
  projectGraphToList,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * Read-only synthetic Living Access Graph with mandatory list alternative.
 */
export async function GET() {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.livingAccessGraph
  ) {
    return NextResponse.json(
      { error: "Living Access Graph is disabled" },
      { status: 404 },
    );
  }

  const graph = getHarbourGraph();
  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    graph,
    listAlternative: {
      nodes: projectGraphToList(graph),
      edges: projectEdgesToList(graph),
    },
    limitations: graph.limitations,
  });
}
