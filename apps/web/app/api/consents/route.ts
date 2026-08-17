import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  grantConsent,
  listConsentsForParticipant,
} from "@/lib/consent/consent-service";
import { grantConsentSchema } from "@/lib/validation/consent";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const consents = await listConsentsForParticipant(user.id);
  return jsonOk({ consents });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = grantConsentSchema.parse(await req.json());
    const record = await grantConsent({
      subjectUserId: user.id,
      grantedToUserId: parsed.grantedToUserId,
      grantedToOrganisationId: parsed.grantedToOrganisationId,
      scope: parsed.scope,
      purpose: parsed.purpose,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
      createdById: user.id,
      shareMode: parsed.shareMode,
      recipientType: parsed.recipientType,
      dataScope: parsed.dataScope,
      sourceAction: parsed.sourceAction,
    });
    return jsonOk({ consent: record }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Grant failed", 500);
  }
}
