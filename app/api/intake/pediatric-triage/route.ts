import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { isThrivingKidsTriageEnabled } from "@/lib/config/thriving-kids";
import { determineChildRoutingPathway } from "@/lib/intake/triage-engine";
import { ThrivingKidsTriageSchema } from "@/lib/schemas/thriving-kids-triage";

export async function POST(req: Request) {
  if (!isThrivingKidsTriageEnabled()) {
    return jsonError("Thriving Kids triage is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "booking:create") ||
    hasPermission(user.primaryRole, "care:manage:self") ||
    user.primaryRole === "family_member" ||
    user.primaryRole === "support_coordinator" ||
    isAdminRole(user.primaryRole);
  if (!allowed) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = ThrivingKidsTriageSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const routing = determineChildRoutingPathway(parsed.data);

  await createAuditEvent({
    actorUserId: user.id,
    action: "intake.pediatric_triage.routed",
    entityType: "ThrivingKidsTriage",
    entityId: parsed.data.participantId,
    participantId: parsed.data.participantId,
    metadata: {
      pathway: routing.pathway,
      ageYears: routing.ageYears,
      maxDomainScore: routing.maxDomainScore,
      primaryPresentingConcern: parsed.data.primaryPresentingConcern,
      hasFormalDiagnosis: parsed.data.hasFormalDiagnosis,
      requiresNdisApplication: routing.requiresNdisApplication,
    },
  });

  return jsonOk({
    pathway: routing.pathway,
    summary: routing.summary,
    nextSteps: routing.nextSteps,
    requiresNdisApplication: routing.requiresNdisApplication,
    ageYears: routing.ageYears,
    maxDomainScore: routing.maxDomainScore,
    notice: routing.notice,
  });
}
