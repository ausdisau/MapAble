import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  evaluateAuthorityDecision,
  listAuthorityDecisionsForParticipant,
} from "@/lib/authority/authority-decision-service";

const evaluateSchema = z.object({
  domain: z.string().min(1),
  action: z.string().min(1),
  consentScopes: z.array(z.string()).optional(),
  purpose: z.string().max(500).optional(),
  participantId: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function GET() {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  try {
    const decisions = await listAuthorityDecisionsForParticipant(
      actor.id,
      actor.id,
    );
    return jsonOk({ decisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    if (message === "PARTICIPANT_AUTHORITY_REQUIRED") {
      return jsonError("Not authorised to view decisions", 403);
    }
    return jsonError(message, 400);
  }
}

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = evaluateSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const participantId = parsed.data.participantId ?? actor.id;

  try {
    const result = await evaluateAuthorityDecision({
      participantId,
      actorUserId: actor.id,
      domain: parsed.data.domain,
      action: parsed.data.action,
      consentScopes: parsed.data.consentScopes,
      purpose: parsed.data.purpose,
      tenantId: parsed.data.tenantId,
      actorKind: "user",
    });
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluate failed";
    if (message === "SERVICE_ACCOUNT_PARTICIPANT_AUTHORITY_DENIED") {
      return jsonError(
        "Service accounts cannot evaluate participant authority",
        403,
      );
    }
    return jsonError(message, 400);
  }
}
