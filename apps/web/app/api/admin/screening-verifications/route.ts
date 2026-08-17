import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listScreeningVerifications } from "@/lib/workers/worker-screening-service";

export async function GET() {
  const user = await requireApiAdminScope("admin:workers:read");
  if (user instanceof Response) return user;

  const verifications = await listScreeningVerifications();
  return jsonOk({ verifications });
}
