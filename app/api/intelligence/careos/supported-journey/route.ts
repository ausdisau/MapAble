import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { careOSFeatureFlags } from "@/lib/intelligence/careos/config/feature-flags";
import { buildCareOSContext } from "@/lib/intelligence/careos/context/context-builder";
import { superviseSupportedJourney } from "@/lib/intelligence/careos/journey/supervisor";
import {
  simulateJourneyConfirmation,
  supportedJourneyRequestSchema,
} from "@/lib/intelligence/careos/journey/supported-journey";

const confirmationSchema = z.object({
  optionId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!careOSFeatureFlags.enabled || !careOSFeatureFlags.simulationEnabled) {
    return jsonError("FEATURE_DISABLED", 503);
  }
  try {
    const body = await request.json();
    const input = supportedJourneyRequestSchema.parse({
      ...body,
      participantId: user.id,
      tenantId: "synthetic-tenant",
    });
    const context = await buildCareOSContext({ user });
    return jsonOk({ journey: await superviseSupportedJourney({ request: input, context }) });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("JOURNEY_UNAVAILABLE", 503);
  }
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!careOSFeatureFlags.enabled || !careOSFeatureFlags.simulationEnabled) {
    return jsonError("FEATURE_DISABLED", 503);
  }
  try {
    return jsonOk({ reservation: simulateJourneyConfirmation(confirmationSchema.parse(await request.json())) });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("SIMULATION_UNAVAILABLE", 503);
  }
}
