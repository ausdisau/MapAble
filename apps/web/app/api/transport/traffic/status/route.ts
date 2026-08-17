import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getLiveTrafficStatus } from "@/lib/tfnsw/live-traffic-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET() {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const status = await getLiveTrafficStatus();
    return jsonOk({ status, configured: true });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
