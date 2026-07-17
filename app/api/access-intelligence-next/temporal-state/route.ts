import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  evaluateTemporalAccess,
  fuseTemporalOverlay,
  getHarbourGraph,
  type AccessEvidenceReference,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * Shadow temporal state overlay for Harbour synthetic nodes.
 * POST body: { at?: string, nodeId?: string }
 */
export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.temporalAccessEngine
  ) {
    return NextResponse.json(
      { error: "Temporal Access Engine is disabled" },
      { status: 404 },
    );
  }

  let body: { at?: string; nodeId?: string } = {};
  try {
    body = (await request.json()) as { at?: string; nodeId?: string };
  } catch {
    body = {};
  }

  const at = body.at && !Number.isNaN(Date.parse(body.at)) ? body.at : new Date().toISOString();
  const graph = getHarbourGraph();
  const nodes = body.nodeId
    ? graph.nodes.filter((n) => n.id === body.nodeId)
    : graph.nodes;

  const evaluations = nodes.flatMap((node) => {
    return node.ontologyConceptIds.map((conceptId) => {
      const evidence: AccessEvidenceReference = {
        evidenceId: `ev:${node.id}:${conceptId}`,
        class: node.evidenceClass,
        ontologyConceptId: conceptId,
        source: "harbour_synthetic_fixture",
        observedAt: node.observedAt,
        summary: node.listSummary,
        limitations: ["Synthetic"],
      };
      const op =
        conceptId === "physical.lift_operational"
          ? node.properties.lift_operational == null
            ? "unknown"
            : node.properties.lift_operational
              ? "available"
              : "unavailable"
          : null;
      return evaluateTemporalAccess({
        ontologyConceptId: conceptId,
        evidence,
        at,
        operationalState: op,
      });
    });
  });

  const overlay = fuseTemporalOverlay("accessplace:synthetic:harbour_civic", at, evaluations);

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    shadow: true,
    productionClaim: "none",
    overlay,
    limitations: [
      "Shadow evaluation only",
      "Does not mutate AccessPlace or Twin writers",
      "Stale remains stale; unknown remains unknown",
    ],
  });
}
