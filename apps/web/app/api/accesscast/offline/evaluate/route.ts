import { NextResponse } from "next/server";

import {
  accessCastFlags,
  compileAccessCastOfflinePack,
  evaluateOfflineAccessCast,
  forecastHarbourPlaceOutlook,
  forecastStartingWorkJourney,
  offlinePresentationCopy,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

/**
 * Compile + evaluate an offline AccessCast Visit Pack projection (synthetic).
 * Does not persist server-side. Companion encrypted store owns local persistence.
 */
export async function POST(request: Request) {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json({ error: "AccessCast is disabled" }, { status: 404 });
  }

  let body: {
    scenarioId?: "harbour_place_baseline" | "starting_work_tomorrow";
    evaluateAt?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const result =
    body.scenarioId === "starting_work_tomorrow"
      ? forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" })
      : forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });

  const pack = compileAccessCastOfflinePack(result);
  const evaluateAt = body.evaluateAt ?? new Date().toISOString();
  const evaluation = evaluateOfflineAccessCast(pack, evaluateAt);
  const presentation = offlinePresentationCopy(evaluation);

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    pack: {
      packId: pack.packId,
      forecastId: pack.forecastId,
      generatedAt: pack.generatedAt,
      expiresAt: pack.expiresAt,
      savedAt: pack.savedAt,
      stateAtSave: pack.stateAtSave,
      sourcesNotRefreshed: pack.sourcesNotRefreshed,
      offlineClaim: pack.offlineClaim,
      limitations: pack.limitations,
    },
    evaluation: {
      evaluatedAt: evaluation.evaluatedAt,
      effectiveState: evaluation.effectiveState,
      changedSinceSaved: evaluation.changedSinceSaved,
      expired: evaluation.expired,
      reasons: evaluation.reasons,
      limitations: evaluation.limitations,
    },
    presentation,
  });
}
