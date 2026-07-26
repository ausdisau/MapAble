import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  detectAccessChange,
  isDurableEvidenceEnabled,
  persistChangeReview,
  persistEvidenceObservation,
  storeShadowChangeReview,
  type AccessChangeCandidate,
} from "@/lib/access/intelligence-next";
import { HARBOUR_PILOT } from "@/lib/access/intelligence-next/evidence/harbour-pilot";

export const dynamic = "force-dynamic";

/**
 * Change detection — creates review objects; never auto-overwrites verified evidence.
 * When evidence persistence is enabled, reviews and observation envelopes are durable.
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
  let durable: {
    reviewRecordId: string;
    envelopeRecordId: string | null;
  } | null = null;

  if (isDurableEvidenceEnabled()) {
    const persisted = await persistEvidenceObservation({
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
      subjectNodeId: candidate.subjectNodeId,
      ontologyConceptId: candidate.ontologyConceptId,
      evidenceClass: candidate.evidenceClass,
      source: candidate.source,
      summary: review.newCandidateSummary,
      observedAt: candidate.observedAt,
      effectiveTo: candidate.expiryAt,
      confidenceBasis: `method:${candidate.method}`,
      contributorMode: "private",
    });
    const persistedReview = await persistChangeReview({
      review,
      evidenceEnvelopeRecordId: persisted.id,
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
    });
    durable = {
      reviewRecordId: persistedReview.id,
      envelopeRecordId: persisted.id,
    };
  }

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    shadow: !durable,
    durable: Boolean(durable),
    productionClaim: "none",
    review,
    durableIds: durable,
    limitations: [
      durable
        ? "Durable review store — still not a safety guarantee"
        : "Shadow in-memory review store — not durable",
      "Verified evidence is never overwritten automatically",
      "Model candidates are not verified evidence",
      "No auto-publication to AccessPlace",
    ],
  });
}
