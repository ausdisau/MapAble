import { z } from "zod";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import { hardConstraintsSchema } from "@/lib/ai/navigator/matching/types";
import { runNavigatorProviderSearchTurn } from "@/lib/ai/navigator/orchestrator";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const interpretBodySchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    goalText: z.string().max(2000).optional(),
    structuredFilters: z
      .object({
        q: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        service: z.string().max(200).optional(),
        access: z.string().max(200).optional(),
        provider: z.string().max(200).optional(),
        state: z.string().max(10).optional(),
        postcode: z.string().max(12).optional(),
      })
      .strict()
      .optional(),
    hardConstraints: hardConstraintsSchema.default({
      requiredServices: [],
      exclusions: [],
      communicationRequirements: [],
      accessibilityRequirements: [],
      credentialRequirements: [],
      nonNegotiableKeys: [],
    }),
    aiOptedOut: z.boolean().optional(),
  })
  .strict();

/**
 * Interpret-only Navigator pilot endpoint — returns reviewed interpretation
 * for participant confirmation. Does not search providers.
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled()) {
    return jsonError("NAVIGATOR_PILOT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-pilot-interpret:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = interpretBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: "navigator.provider_search.interpret",
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
  });
  // Interpret capability requires model-assisted flag; when off, still allow
  // deterministic passthrough via orchestrator with interpretationConfirmed=false.
  if (!gate.allowed && gate.reason !== "feature_flag_disabled") {
    return jsonError(`NAVIGATOR_GATE_DENIED:${gate.reason}`, 403);
  }

  const consent = await verifyPurposeConsent({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: "interpret",
    delegationDomain: "navigator",
  });
  if (!consent.ok) {
    return jsonError(`NAVIGATOR_CONSENT_${consent.reason.toUpperCase()}`, 403);
  }

  try {
    const result = await runNavigatorProviderSearchTurn({
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      actorUserId: user.id,
      goalText: parsed.data.goalText,
      structuredFilters: parsed.data.structuredFilters,
      hardConstraints: parsed.data.hardConstraints,
      interpretationConfirmed: false,
      aiOptedOut: parsed.data.aiOptedOut ?? true,
    });

    if (result.status !== "needs_review" && result.status !== "blocked") {
      // Interpret route must never search — force review shape.
      return jsonOk({
        status: "needs_review",
        interpretation: result.interpretation,
      });
    }

    return jsonOk({
      status: result.status,
      interpretation: result.interpretation,
      reason: result.status === "blocked" ? result.reason : undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_INTERPRET_ERROR";
    return jsonError(message, 400);
  }
}
