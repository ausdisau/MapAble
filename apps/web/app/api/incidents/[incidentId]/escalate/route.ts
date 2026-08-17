import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { escalateIncident } from "@/lib/incidents/incident-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { incidentId } = await params;
  const incident = await escalateIncident(incidentId, user.id);
  return jsonOk({ incident });
}
