import { z } from "zod";

import {
  createDecisionPassport,
  getDecisionPassport,
} from "@/lib/ai/navigator/passport/service";
import {
  hardConstraintsSchema,
  passportInterpretationSchema,
  rankingWeightsSchema,
  shortlistSchema,
  sourceRefSchema,
} from "@/lib/ai/navigator/passport/types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPassportEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const createSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    sessionId: z.string().min(1),
    goalSummary: z.string().min(1).max(500),
    interpretation: passportInterpretationSchema.optional(),
    hardConstraints: hardConstraintsSchema.optional(),
    rankingWeights: rankingWeightsSchema.optional(),
    sources: z.array(sourceRefSchema).max(50).optional(),
    shortlist: shortlistSchema.optional(),
    uncertaintyNotes: z.array(z.string().max(300)).max(20).optional(),
    limitationsNotes: z.array(z.string().max(300)).max(20).optional(),
    conflictsOfInterest: z.array(z.string().max(300)).max(20).optional(),
    aiInvolved: z.boolean().optional(),
    modelIndependentRules: z.array(z.string().max(300)).max(30).optional(),
    nextStep: z.string().max(500).nullable().optional(),
    nextStepController: z.string().max(80).optional(),
    consentedPurpose: z.string().min(1).max(200),
    consentRecordId: z.string().min(1).nullable().optional(),
  })
  .strict();

const getQuerySchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  id: z.string().min(1),
});

export async function POST(req: Request) {
  if (!isNavigatorPassportEnabled()) {
    return jsonError("NAVIGATOR_PASSPORT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-passport-create:${ip}`, {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const passport = await createDecisionPassport({
      ...parsed.data,
      actorUserId: user.id,
    });
    return jsonOk({ passport });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_PASSPORT_ERROR";
    return jsonError(message, 400);
  }
}

export async function GET(req: Request) {
  if (!isNavigatorPassportEnabled()) {
    return jsonError("NAVIGATOR_PASSPORT_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = getQuerySchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
    participantId: url.searchParams.get("participantId"),
    id: url.searchParams.get("id"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const passport = await getDecisionPassport({
    id: parsed.data.id,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
  });
  if (!passport) {
    return jsonError("NAVIGATOR_PASSPORT_NOT_FOUND", 404);
  }

  return jsonOk({ passport });
}
