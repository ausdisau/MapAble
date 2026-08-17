import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { createPlanManagerExportV1 } from "@/lib/support/plan-manager/export-service";

export async function POST(req: Request) {
  if (!y2OrchestrationConfig.planManagerIntegrationEnabled) {
    return jsonError("Plan manager integration disabled", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "plan_manager:portal")) {
    return jsonError("Forbidden", 403);
  }

  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey !== process.env.PLAN_MANAGER_API_KEY) {
    return jsonError("Invalid API key", 401);
  }

  const body = await req.json().catch(() => ({}));
  const format = body.format === "csv" ? "csv" : "json";

  const result = await createPlanManagerExportV1({
    planManagerId: user.id,
    format,
    pseudonymiseParticipants: body.pseudonymiseParticipants === true,
  });

  return jsonOk(result, 201);
}
