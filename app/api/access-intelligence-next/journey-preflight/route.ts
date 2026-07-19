import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  runDoorToRoomPreflight,
  taylorRoom312Query,
  type AccessQueryAst,
  type ParticipantRequirementSet,
  compileParticipantRequirements,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * Proof-carrying door-to-room journey preflight (synthetic).
 * Defaults to Taylor Room 3.12 Harbour scenario when query omitted.
 */
export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.proofCarryingResults
  ) {
    return NextResponse.json(
      { error: "Proof-carrying journey preflight is disabled" },
      { status: 404 },
    );
  }

  let body: {
    query?: AccessQueryAst;
    requirementSet?: ParticipantRequirementSet;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const query = body.query ?? taylorRoom312Query();
  const requirementSetRef = body.requirementSet
    ? compileParticipantRequirements(body.requirementSet).requirementSetRef
    : "fixture:taylor-harbour-v1";

  const { preflight, proof } = runDoorToRoomPreflight({ query, requirementSetRef });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    preflight,
    proof,
    segmentListAlternative: preflight.segments.map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label,
      personalFit: s.personalFit,
      operationalState: s.operationalState,
      confirmationRequired: s.confirmationRequired,
      confirmationQuestion: s.confirmationQuestion,
      evidenceSummary: s.evidenceSummary,
      burdenNotes: s.burdenNotes,
    })),
    limitations: preflight.limitations,
  });
}
