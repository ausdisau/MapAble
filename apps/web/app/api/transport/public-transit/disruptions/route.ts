import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  fetchLiftOutages,
  fetchTransitDisruptions,
} from "@/lib/transport/public-transit/disruptions-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);
    const regionCode = url.searchParams.get("region") ?? undefined;
    const liftOnly = url.searchParams.get("liftOutages") === "true";

    if (liftOnly) {
      const liftOutages = await fetchLiftOutages();
      return jsonOk({ liftOutages, nonLiveFallback: true });
    }

    const result = await fetchTransitDisruptions(regionCode);
    return jsonOk(result);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
