import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isStartingWorkPilotEnabled,
  startingWorkPilotConfig,
} from "@/lib/config/starting-work-pilot";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";
import { getStartingWorkLoopStatus } from "@/lib/pilot/starting-work/loop-status";
import {
  getStartingWorkProjection,
  persistStartingWorkJourney,
} from "@/lib/pilot/starting-work/persist";

const failureModeSchema = z.enum([
  "stale_credential",
  "inaccessible_vehicle",
  "expired_consent",
  "worker_cancellation",
  "lift_outage",
  "lost_phone",
  "equipment_breakdown",
  "rejected_invoice",
  "handoff_not_accepted",
  "participant_declines_outcome_review",
  "provider_disputes_evidence",
  "cross_tenant_access",
  "duplicated_request",
  "external_timeout",
]);

const postSchema = z
  .object({
    failureMode: failureModeSchema.optional(),
    readinessReady: z.boolean().optional(),
    consentActive: z.boolean().optional(),
  })
  .strict();

export async function GET(req: Request) {
  if (!isStartingWorkPilotEnabled()) {
    return jsonError("Starting Work pilot is not enabled", 503);
  }

  const journeyId = new URL(req.url).searchParams.get("journeyId");
  if (journeyId) {
    const projection = await getStartingWorkProjection(journeyId);
    if (!projection) {
      return jsonError("Projection not found or DB persistence disabled", 404);
    }
    return jsonOk({
      projection,
      productionClaim: "none",
      notice: "Temporary projection — not CareOSMission SoR",
    });
  }

  return jsonOk({
    pilot: "starting_work",
    venue: "Harbour Civic Centre",
    participant: "Taylor (synthetic)",
    syntheticOnly: startingWorkPilotConfig.syntheticOnly,
    dbPersistence: startingWorkPilotConfig.dbPersistence,
    loops: getStartingWorkLoopStatus(),
    page: "/pilot/starting-work",
    prohibitions: [
      "no_auto_assignment",
      "no_live_ndia",
      "no_ai_decisions",
      "no_smartphone_only_essential_access",
      "no_competing_care_transport_billing_writers",
    ],
  });
}

export async function POST(req: Request) {
  if (!isStartingWorkPilotEnabled()) {
    return jsonError("Starting Work pilot is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const parsed = postSchema.parse(body ?? {});
    const state = runGoldenJourney(parsed);
    const persisted = await persistStartingWorkJourney({
      state,
      actorUserId: user.id,
    });
    return jsonOk({
      state,
      persisted,
      actorUserId: user.id,
      notice:
        "Synthetic controlled-pilot simulation — not a live booking engine; projection is not CareOSMission",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}
