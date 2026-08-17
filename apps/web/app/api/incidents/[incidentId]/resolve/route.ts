import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { resolveIncident } from "@/lib/incidents/incident-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { incidentId } = await params;
  const body = await req.json();
  if (!body.resolutionSummary) {
    return jsonError("resolutionSummary required", 400);
  }
  const incident = await resolveIncident(
    incidentId,
    user.id,
    body.resolutionSummary
  );
  return jsonOk({ incident });
}
