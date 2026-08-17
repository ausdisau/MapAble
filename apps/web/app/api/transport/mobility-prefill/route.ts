import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getMobilityPrefillForUser } from "@/lib/transport/profile-prefill-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const prefill = await getMobilityPrefillForUser(user);
    return jsonOk(prefill);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
