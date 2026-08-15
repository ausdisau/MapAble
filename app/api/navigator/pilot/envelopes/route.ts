import { z } from "zod";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import {
  createGovernedActionEnvelope,
  getGovernedActionEnvelope,
} from "@/lib/ai/navigator/envelopes/service";
import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorEnvelopesEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const createSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    capabilityKey: z
      .literal("navigator.provider_search.draft_service_request")
      .default("navigator.provider_search.draft_service_request"),
    action: z.enum([
      "create_service_request_draft",
      "transfer_filters_to_finder",
    ]),
    payload: z.record(z.string(), z.unknown()),
    evidenceRefs: z.array(z.string().max(200)).max(50).optional(),
    sourceRefs: z.array(z.string().max(200)).max(50).optional(),
    requiredApproverRole: z.string().min(1).max(80).default("participant"),
    lifetimeMinutes: z.number().int().min(1).max(1440).optional(),
  })
  .strict();

/**
 * Create a draft-only governed action envelope for the Navigator pilot.
 * Flags default false — returns 403 when disabled.
 */
export async function POST(req: Request) {
  if (!isNavigatorEnvelopesEnabled()) {
    return jsonError("NAVIGATOR_ENVELOPES_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-envelope-create:${ip}`, {
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

  const gate = await assertNavigatorCapability({
    capabilityKey: parsed.data.capabilityKey,
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
    action: parsed.data.action,
    delegationDomain: "navigator",
  });
  if (!consent.ok) {
    return jsonError(`NAVIGATOR_CONSENT_${consent.reason.toUpperCase()}`, 403);
  }

  try {
    const envelope = await createGovernedActionEnvelope({
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      initiatingUserId: user.id,
      capabilityKey: parsed.data.capabilityKey,
      action: parsed.data.action,
      payload: parsed.data.payload,
      evidenceRefs: parsed.data.evidenceRefs ?? [],
      sourceRefs: parsed.data.sourceRefs ?? [],
      consentReceiptId: consent.consentReceiptId ?? consent.consentRecordId,
      requiredApproverRole: parsed.data.requiredApproverRole,
      lifetimeMinutes: parsed.data.lifetimeMinutes,
    });
    return jsonOk({
      envelope: {
        id: envelope.id,
        status: envelope.status,
        action: envelope.action,
        expiresAt: envelope.expiresAt,
        payloadHash: envelope.payloadHash,
        draftOnly: true,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_ENVELOPE_ERROR";
    return jsonError(message, 400);
  }
}

const getQuerySchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  envelopeId: z.string().min(1),
});

/** Tenant + participant scoped envelope read (IDOR-safe). */
export async function GET(req: Request) {
  if (!isNavigatorEnvelopesEnabled()) {
    return jsonError("NAVIGATOR_ENVELOPES_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = getQuerySchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
    participantId: url.searchParams.get("participantId"),
    envelopeId: url.searchParams.get("envelopeId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  // Actor must be the participant (or later: authorised delegate — Phase 2 UI).
  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const envelope = await getGovernedActionEnvelope({
    envelopeId: parsed.data.envelopeId,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
  });
  if (!envelope) {
    return jsonError("NAVIGATOR_ENVELOPE_NOT_FOUND", 404);
  }

  return jsonOk({
    envelope: {
      id: envelope.id,
      status: envelope.status,
      action: envelope.action,
      expiresAt: envelope.expiresAt,
      payloadHash: envelope.payloadHash,
      draftOnly: true,
      // Nonce intentionally omitted from client responses.
    },
  });
}
