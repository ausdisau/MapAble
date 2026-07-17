import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { reportTripSafetyIssue } from "@/lib/transport/transport-safety-service";
import { reportSafetyIssueSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = reportSafetyIssueSchema.parse(await req.json());
    return jsonOk(await reportTripSafetyIssue(user, tripId, body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
