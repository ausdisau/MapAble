import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { listCoordinatorParticipants } from "@/lib/support-coordinator/relationship-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonOk({ participants: [] });
  }

  return jsonOk({ participants: await listCoordinatorParticipants(user.id) });
}
