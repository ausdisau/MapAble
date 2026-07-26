import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { createOptimisationJob } from "@/lib/transport/routing/route-optimisation-service";
import { routeOptimiseSchema } from "@/lib/validation/transport-routing-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  try {
    const body = routeOptimiseSchema.parse(await req.json());
    const job = await createOptimisationJob({ input: body });
    return jsonOk({ job }, 201);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
