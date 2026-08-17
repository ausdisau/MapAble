import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { submitTripEvidence } from "@/lib/transport/transport-evidence-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tripEvidenceSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = tripEvidenceSchema.parse(await req.json());
    return jsonOk(await submitTripEvidence(user, tripId, body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
