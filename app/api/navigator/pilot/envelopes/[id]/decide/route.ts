import { z } from "zod";

import {
  approveGovernedActionEnvelope,
  rejectGovernedActionEnvelope,
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

const decideSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    reason: z.string().max(2000).optional(),
    approverRole: z.string().min(1).max(80).default("participant"),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

/**
 * Approve (draft materialise) or reject a governed envelope.
 * Never books or pays. Revalidates consent and feature flags.
 */
export async function POST(req: Request, ctx: Ctx) {
  if (!isNavigatorEnvelopesEnabled()) {
    return jsonError("NAVIGATOR_ENVELOPES_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-envelope-decide:${ip}`, {
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

  const parsed = decideSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  if (parsed.data.decision === "reject") {
    try {
      const envelope = await rejectGovernedActionEnvelope({
        envelopeId: id,
        tenantId: parsed.data.tenantId,
        participantId: parsed.data.participantId,
        actorUserId: user.id,
        reason: parsed.data.reason ?? "rejected_by_participant",
      });
      return jsonOk({ envelope: { id: envelope.id, status: envelope.status } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "NAVIGATOR_ENVELOPE_ERROR";
      return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
    }
  }

  const consent = await verifyPurposeConsent({
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    actorUserId: user.id,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: "approve_draft_envelope",
    delegationDomain: "navigator",
  });

  try {
    const envelope = await approveGovernedActionEnvelope({
      envelopeId: id,
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      approverUserId: user.id,
      approverRole: parsed.data.approverRole,
      reason: parsed.data.reason,
      consentStillValid: consent.ok,
    });
    return jsonOk({
      envelope: {
        id: envelope.id,
        status: envelope.status,
        draftOnly: true,
        executionResult: envelope.executionResult,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_ENVELOPE_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}
