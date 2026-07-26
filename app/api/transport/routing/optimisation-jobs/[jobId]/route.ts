import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { getOptimisationJob } from "@/lib/transport/routing/route-optimisation-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const { jobId } = await params;
  try {
    return jsonOk({ job: await getOptimisationJob(jobId) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
