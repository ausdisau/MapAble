import { NextResponse } from "next/server";

import {
  accessCastFlags,
  compileAccessCastOfflinePack,
  evaluateOfflineAccessCast,
  forecastHarbourPlaceOutlook,
  forecastStartingWorkJourney,
  generateAccessCast,
  type AccessCastRequest,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

/**
 * Synthetic AccessCast demo API.
 * No database. No live sources. Flags default off → 404.
 */
export async function POST(request: Request) {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json({ error: "AccessCast is disabled" }, { status: 404 });
  }

  let body: AccessCastRequest & {
    includeOfflinePack?: boolean;
    evaluateOfflineAt?: string;
  } = {
    requirementSetRef: "fixture:taylor-harbour-v1",
    intendedJourneyTime: "2026-09-17T08:30:00+10:00",
  };

  try {
    body = { ...body, ...((await request.json()) as typeof body) };
  } catch {
    // keep defaults
  }

  const scenario = body.scenarioId ?? "harbour_place_baseline";
  const result =
    scenario === "starting_work_tomorrow" ||
    scenario === "return_journey_fragile" ||
    Boolean(body.journeyRef)
      ? forecastStartingWorkJourney(body)
      : scenario
        ? forecastHarbourPlaceOutlook(body)
        : generateAccessCast(body);

  const payload: Record<string, unknown> = {
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    tagline: "Know before you go.",
    result,
    listAlternative: result.listAlternative,
    limitations: result.limitations,
  };

  if (body.includeOfflinePack) {
    const pack = compileAccessCastOfflinePack(result);
    payload.offlinePack = pack;
    if (body.evaluateOfflineAt) {
      payload.offlineEvaluation = evaluateOfflineAccessCast(pack, body.evaluateOfflineAt);
    }
  }

  return NextResponse.json(payload);
}

export async function GET() {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json({ error: "AccessCast is disabled" }, { status: 404 });
  }

  const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });
  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    result,
    listAlternative: result.listAlternative,
  });
}
