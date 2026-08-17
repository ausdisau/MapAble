import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { careOSFeatureFlags } from "@/lib/intelligence/careos/config/feature-flags";
import {
  runDeterministicSupportSimulation,
  supportSimulationScenarioSchema,
} from "@/lib/intelligence/careos/simulation/support-simulation";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!careOSFeatureFlags.enabled || !careOSFeatureFlags.simulationEnabled) {
    return jsonError("FEATURE_DISABLED", 503);
  }
  try {
    const result = runDeterministicSupportSimulation(
      supportSimulationScenarioSchema.parse(await request.json())
    );
    return jsonOk({ result });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("SIMULATION_UNAVAILABLE", 503);
  }
}
