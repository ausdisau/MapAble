import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  exportConsentAuditCsv,
  isMicroConsentV2Enabled,
  listMicroConsentsForParticipant,
  recordMicroConsentGrant,
  revokeMicroConsent,
} from "@/lib/consent/micro-consent-service";
import { microConsentPostSchema } from "@/lib/validation/micro-consent";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const exportCsv = url.searchParams.get("export") === "csv";

  if (exportCsv) {
    if (!isAdminRole(user.primaryRole)) {
      return jsonError("Forbidden", 403);
    }
    const csv = await exportConsentAuditCsv({
      pseudonymiseParticipants: url.searchParams.get("pseudonymise") === "true",
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="consent-audit.csv"',
      },
    });
  }

  const consents = await listMicroConsentsForParticipant(user.id);
  return jsonOk({ consents, v2Enabled: isMicroConsentV2Enabled() });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  let parsed;
  try {
    parsed = microConsentPostSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }

  if (parsed.action === "revoke") {
    const record = await revokeMicroConsent({
      consentId: parsed.consentId,
      revokedById: user.id,
    });
    return jsonOk({ record });
  }

  const record = await recordMicroConsentGrant({
    action: parsed.microAction,
    subjectUserId: user.id,
    createdById: user.id,
    purpose: parsed.purpose ?? `Consent for ${parsed.microAction}`,
    grantedToUserId: parsed.grantedToUserId,
    grantedToOrganisationId: parsed.grantedToOrganisationId,
    shareMode: parsed.shareMode,
  });

  return jsonOk({ record }, 201);
}
