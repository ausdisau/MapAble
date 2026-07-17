import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  detectAccessChange,
  storeShadowChangeReview,
  type AccessChangeCandidate,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * Shadow change detection — creates review objects; never auto-overwrites verified evidence.
 */
export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.changeDetection
  ) {
    return NextResponse.json(
      { error: "Access change detection is disabled" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const candidate = (body as { candidate?: AccessChangeCandidate }).candidate;
  if (!candidate?.candidateId || !candidate.subjectNodeId || !candidate.ontologyConceptId) {
    return NextResponse.json(
      { error: "Body must include candidate with candidateId, subjectNodeId, ontologyConceptId" },
      { status: 400 },
    );
  }

  const review = storeShadowChangeReview(detectAccessChange(candidate));

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    shadow: true,
    productionClaim: "none",
    review,
    limitations: [
      "Shadow in-memory review store — not durable",
      "Verified evidence is never overwritten automatically",
      "Model candidates are not verified evidence",
    ],
  });
}
