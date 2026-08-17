import { NextResponse } from "next/server";

import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import {
  ACCESS_ONTOLOGY_CURRENT,
  ACCESS_ONTOLOGY_V1,
  ONTOLOGY_CONCEPT_ALIASES_V1_TO_V2,
  accessIntelligenceNextFlags,
} from "@/lib/access/intelligence-next";

export const dynamic = "force-dynamic";

/**
 * GET Access as Infrastructure ontology (v2) + v1 aliases.
 * Flag-gated; synthetic / documentation contracts only.
 */
export async function GET() {
  const enabled =
    accessInfrastructureFlags.enabled ||
    (accessIntelligenceNextFlags.enabled && accessIntelligenceNextFlags.ontology);

  if (!enabled) {
    return NextResponse.json(
      {
        error: "Access Infrastructure ontology is disabled",
        flags: {
          accessInfrastructure: accessInfrastructureFlags.enabled,
          accessIntelligenceNext: accessIntelligenceNextFlags.enabled,
          ontology: accessIntelligenceNextFlags.ontology,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    framework: "access_as_infrastructure",
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    ontology: ACCESS_ONTOLOGY_CURRENT,
    legacyOntology: ACCESS_ONTOLOGY_V1,
    aliases: ONTOLOGY_CONCEPT_ALIASES_V1_TO_V2,
    limitations: [
      "Contract seed only",
      "Not a certification scheme",
      "Not a universal accessibility score",
      "Diagnosis must never be required for matching",
    ],
  });
}
