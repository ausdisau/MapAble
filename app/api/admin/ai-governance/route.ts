import {
  getAiGovernanceDashboard,
  recordAiGovernanceIncident,
} from "@/lib/ai/governance/governance-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getAiGovernanceDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const incident = await recordAiGovernanceIncident({
    summary: body.summary,
    severity: body.severity,
    monitorId: body.monitorId,
    actorUserId: user.id,
  });
  return jsonOk({ incident });
}
