import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { getTransportTripForUser } from "@/lib/transport/transport-trip-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { tripId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
    if (!trip || trip.providerOrganisationId !== orgId) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    }
    return jsonOk(await getTransportTripForUser(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
