import { NextResponse } from "next/server";

import {
  ACCESS_ONTOLOGY_V1,
  accessIntelligenceNextFlags,
} from "@/lib/access/intelligence-next";

export const dynamic = "force-dynamic";

/**
 * GET ontology seed — flag-gated, synthetic contracts only.
 */
export async function GET() {
  if (!accessIntelligenceNextFlags.enabled || !accessIntelligenceNextFlags.ontology) {
    return NextResponse.json(
      {
        error: "Access Intelligence Next ontology is disabled",
        flags: {
          enabled: accessIntelligenceNextFlags.enabled,
          ontology: accessIntelligenceNextFlags.ontology,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    ontology: ACCESS_ONTOLOGY_V1,
    limitations: [
      "Contract seed only",
      "Not a certification scheme",
      "Not a universal accessibility score",
    ],
  });
}
