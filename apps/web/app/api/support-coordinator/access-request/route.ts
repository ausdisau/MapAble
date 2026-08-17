import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import {
  approveCoordinatorAccess,
  listCoordinatorParticipants,
  requestCoordinatorAccess,
} from "@/lib/support/coordinator/relationship-service";

export async function GET() {
  if (!y2OrchestrationConfig.supportCoordinatorPortalEnabled) {
    return jsonError("Coordinator portal disabled", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonError("Forbidden", 403);
  }

  const participants = await listCoordinatorParticipants(user.id);
  return jsonOk({ participants });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();

  if (body.action === "request_access") {
    if (!hasPermission(user.primaryRole, "coordinator:portal")) {
      return jsonError("Forbidden", 403);
    }
    const request = await requestCoordinatorAccess({
      participantId: body.participantId,
      coordinatorId: user.id,
      scopes: body.scopes ?? ["support_coordination.access"],
    });
    return jsonOk({ request }, 201);
  }

  if (body.action === "approve") {
    const rel = await approveCoordinatorAccess(body.requestId, user.id);
    return jsonOk({ relationship: rel });
  }

  return jsonError("Unknown action", 400);
}
