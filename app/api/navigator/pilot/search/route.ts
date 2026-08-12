import { z } from "zod";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import {
  hardConstraintsSchema,
  rankingWeightsSchema,
} from "@/lib/ai/navigator/matching/types";
import { runNavigatorProviderSearchTurn } from "@/lib/ai/navigator/orchestrator";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isNavigatorMatchingEnabled,
  isNavigatorPilotEnabled,
} from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const structuredFiltersSchema = z
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
  .optional();

const searchBodySchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    sessionId: z.string().min(1).max(120).optional(),
    goalText: z.string().max(2000).optional(),
    structuredFilters: structuredFiltersSchema,
    hardConstraints: hardConstraintsSchema,
    rankingWeights: rankingWeightsSchema.optional(),
    interpretationConfirmed: z.boolean(),
    aiOptedOut: z.boolean().optional(),
    permittedFields: z.array(z.string().min(1).max(80)).max(40).optional(),
    saveDraft: z.boolean().optional(),
    transferFilters: z.boolean().optional(),
  })
  .strict();

/**
 * Run a bounded Navigator provider-search turn (interpret → confirm → match).
 * Never books, pays, or dispatches. Matching flag defaults false.
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled() || !isNavigatorMatchingEnabled()) {
    return jsonError("NAVIGATOR_MATCHING_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-pilot-search:${ip}`, {
      windowMs: 60_000,
      max: 20,
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

  const parsed = searchBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: "navigator.provider_search.match",
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
  });
  if (!gate.allowed) {
    return jsonError(`NAVIGATOR_GATE_DENIED:${gate.reason}`, 403);
  }

  const consent = await verifyPurposeConsent({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: "match",
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
      rankingWeights: parsed.data.rankingWeights,
      interpretationConfirmed: parsed.data.interpretationConfirmed,
      aiOptedOut: parsed.data.aiOptedOut,
      saveDraft: parsed.data.saveDraft,
      sessionId: parsed.data.sessionId,
      permittedFields: parsed.data.permittedFields,
      transferFilters: parsed.data.transferFilters === true,
    });
    return jsonOk({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_SEARCH_ERROR";
    return jsonError(message, 400);
  }
}
