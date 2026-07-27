import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  grantParticipantAuthority,
  listParticipantAuthorityGrants,
  revokeParticipantAuthority,
} from "@/lib/authority/participant-authority-service";

const grantSchema = z.object({
  delegateId: z.string().min(1),
  domain: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
  consentScopes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime(),
  purpose: z.string().max(500).optional(),
  recipientRole: z.string().max(100).optional(),
  tenantId: z.string().optional(),
  evidenceRef: z.string().max(500).optional(),
});

const revokeSchema = z.object({
  grantId: z.string().min(1),
});

export async function GET() {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const grants = await listParticipantAuthorityGrants(actor.id);
  return jsonOk({ grants });
}

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = grantSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const grant = await grantParticipantAuthority({
      participantId: actor.id,
      actorUserId: actor.id,
      delegateId: parsed.data.delegateId,
      domain: parsed.data.domain,
      actions: parsed.data.actions,
      consentScopes: parsed.data.consentScopes,
      expiresAt: new Date(parsed.data.expiresAt),
      purpose: parsed.data.purpose,
      recipientRole: parsed.data.recipientRole,
      tenantId: parsed.data.tenantId,
      evidenceRef: parsed.data.evidenceRef,
    });
    return jsonOk({ grant }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grant failed";
    if (message === "PARTICIPANT_AUTHORITY_REQUIRED") {
      return jsonError("Only the participant can grant authority", 403);
    }
    if (message === "AUTHORITY_EXPIRY_REQUIRED") {
      return jsonError("Expiry must be in the future", 400);
    }
    return jsonError(message, 400);
  }
}

export async function DELETE(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = revokeSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await revokeParticipantAuthority({
      grantId: parsed.data.grantId,
      participantId: actor.id,
      actorUserId: actor.id,
    });
    return jsonOk({ revoked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    if (message === "AUTHORITY_GRANT_NOT_FOUND") {
      return jsonError("Grant not found", 404);
    }
    if (message === "PARTICIPANT_AUTHORITY_REQUIRED") {
      return jsonError("Only the participant can revoke authority", 403);
    }
    return jsonError(message, 400);
  }
}
