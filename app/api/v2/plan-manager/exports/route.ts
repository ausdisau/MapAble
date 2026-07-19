import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { createPlanManagerExportV2 } from "@/lib/plan-manager/export-service";

export async function POST(req: Request) {
  if (!y2OrchestrationConfig.planManagerIntegrationEnabled) {
    return jsonError("Plan manager integration disabled", 403);
  }
  if (!y3NationalTrustConfig.publicApiV2PartnerEnabled) {
    return jsonError("Public API v2 disabled", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "plan_manager:portal")) {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json().catch(() => ({}));
  const format = body.format === "csv" ? "csv" : "json";

  const result = await createPlanManagerExportV2({
    planManagerId: user.id,
    format,
    pseudonymiseParticipants: body.pseudonymiseParticipants === true,
  });

  return jsonOk(result, 201);
}
