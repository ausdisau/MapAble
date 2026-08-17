import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import {
  completeTrainingModule,
  getWorkerComplianceStatus,
  listTrainingModules,
} from "@/lib/engagement/worker-training-service";

export async function GET(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  const view = url.searchParams.get("view");

  if (view === "compliance") {
    if (!organisationId) return jsonError("organisationId is required", 400);
    const allowed = await canProviderAccessOrg(user.id, organisationId);
    if (!allowed) return jsonError("Not authorised", 403);
    const workers = await getWorkerComplianceStatus(organisationId);
    return jsonOk({ workers });
  }

  const modules = await listTrainingModules(organisationId ?? undefined);
  return jsonOk({ modules });
}

export async function POST(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.moduleId || !Array.isArray(body.answers)) {
    return jsonError("moduleId and answers are required", 400);
  }

  try {
    const completion = await completeTrainingModule(
      body.moduleId,
      user.id,
      body.answers
    );
    return jsonOk({ completion }, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not complete module", 400);
  }
}
