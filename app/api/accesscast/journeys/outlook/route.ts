import { NextResponse } from "next/server";

import {
  accessCastFlags,
  forecastStartingWorkJourney,
  type AccessCastRequest,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

/**
 * Starting Work journey AccessCast outlook (synthetic).
 * Requires MAPABLE_ACCESSCAST_ENABLED + JOURNEY_OUTLOOK_ENABLED.
 */
export async function POST(request: Request) {
  if (
    !accessCastFlags.enabled ||
    !accessCastFlags.allowSyntheticExecution ||
    !accessCastFlags.journeyOutlook
  ) {
    return NextResponse.json(
      { error: "AccessCast journey outlook is disabled" },
      { status: 404 },
    );
  }

  let body: Partial<AccessCastRequest> = {};
  try {
    body = (await request.json()) as Partial<AccessCastRequest>;
  } catch {
    body = {};
  }

  const result = forecastStartingWorkJourney({
    requirementSetRef: body.requirementSetRef ?? "fixture:taylor-harbour-v1",
    intendedJourneyTime: body.intendedJourneyTime ?? "2026-09-17T08:30:00+10:00",
    journeyRef: body.journeyRef ?? "journey:synthetic:starting-work-harbour-v1",
    scenarioId: body.scenarioId ?? "starting_work_tomorrow",
    now: body.now,
  });

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    result,
    timeline: result.timeline,
    listAlternative: result.listAlternative,
    limitations: result.limitations,
  });
}
