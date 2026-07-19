import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isStartingWorkPilotEnabled,
  startingWorkPilotConfig,
} from "@/lib/config/starting-work-pilot";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";
import { persistStartingWorkJourney } from "@/lib/pilot/starting-work/persist";

/**
 * Synthetic-only simulate endpoint for golden browser / Playwright journeys.
 * Disabled unless pilot enabled AND syntheticOnly. Never a production booking path.
 */
const querySchema = z
  .object({
    failureMode: z
      .enum([
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
      ])
      .optional(),
  })
  .strict();

export async function GET(req: Request) {
  if (!isStartingWorkPilotEnabled() || !startingWorkPilotConfig.syntheticOnly) {
    return jsonError(
      "Synthetic Starting Work simulate is not enabled (requires pilot + syntheticOnly)",
      503,
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse({
      failureMode: url.searchParams.get("failureMode") ?? undefined,
    });
    const state = runGoldenJourney(parsed);
    const persisted = await persistStartingWorkJourney({
      state,
      actorUserId: null,
    });
    return jsonOk({
      state,
      persisted,
      synthetic: true,
      productionClaim: "none",
      notice: "Synthetic simulate — not authenticated production booking",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}
