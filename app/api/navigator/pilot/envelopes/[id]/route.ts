import { z } from "zod";

import {
  getGovernedActionEnvelope,
  updateGovernedActionEnvelopeDraft,
} from "@/lib/ai/navigator/envelopes/service";
import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorEnvelopesEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const getSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
  })
  .strict();

const patchSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

/** Tenant-safe get of a draft envelope. */
export async function GET(req: Request, ctx: Ctx) {
  if (!isNavigatorEnvelopesEnabled()) {
    return jsonError("NAVIGATOR_ENVELOPES_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const parsed = getSchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
    participantId: url.searchParams.get("participantId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const envelope = await getGovernedActionEnvelope({
    envelopeId: id,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
  });
  if (!envelope) return jsonError("NAVIGATOR_ENVELOPE_NOT_FOUND", 404);
  return jsonOk({ envelope });
}

/** Edit proposed draft payload before approval. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!isNavigatorEnvelopesEnabled()) {
    return jsonError("NAVIGATOR_ENVELOPES_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-envelope-edit:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const consent = await verifyPurposeConsent({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: "edit_draft_envelope",
    delegationDomain: "navigator",
  });
  if (!consent.ok) {
    return jsonError(`CONSENT_${consent.reason.toUpperCase()}`, 403);
  }

  try {
    const envelope = await updateGovernedActionEnvelopeDraft({
      envelopeId: id,
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      actorUserId: user.id,
      payload: parsed.data.payload,
    });
    return jsonOk({
      envelope: {
        id: envelope.id,
        status: envelope.status,
        payload: envelope.payload,
        payloadHash: envelope.payloadHash,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_ENVELOPE_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}
