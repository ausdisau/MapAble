import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import {
  createTransportTrip,
  listTransportTripsForUser,
} from "@/lib/transport/transport-trip-service";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const trips = await listTransportTripsForUser(user);
    return jsonOk({ trips });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = createTransportTripSchema.parse(await req.json());
    const result = await createTransportTrip(user, body);
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}
