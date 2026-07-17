import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  isMicroConsentV2Enabled,
  listMicroConsentsForParticipant,
  MICRO_CONSENT_ACTIONS,
  recordMicroConsentGrant,
  revokeMicroConsent,
  exportConsentAuditCsv,
  type MicroConsentAction,
} from "@/lib/consent/micro-consent-service";

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

  const body = await req.json();

  if (body.action === "revoke") {
    if (!body.consentId) return jsonError("consentId required", 400);
    const record = await revokeMicroConsent({
      consentId: body.consentId,
      revokedById: user.id,
    });
    return jsonOk({ record });
  }

  const microAction = body.microAction as MicroConsentAction;
  if (!microAction || !MICRO_CONSENT_ACTIONS.includes(microAction)) {
    return jsonError("Invalid microAction", 400);
  }

  const record = await recordMicroConsentGrant({
    action: microAction,
    subjectUserId: user.id,
    createdById: user.id,
    purpose: body.purpose ?? `Consent for ${microAction}`,
    grantedToUserId: body.grantedToUserId,
    grantedToOrganisationId: body.grantedToOrganisationId,
    shareMode: body.shareMode,
  });

  return jsonOk({ record }, 201);
}
