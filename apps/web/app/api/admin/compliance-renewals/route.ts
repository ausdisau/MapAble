import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getComplianceRenewalsDashboard,
  markRenewalComplete,
  scheduleComplianceRenewal,
} from "@/lib/compliance/renewals/renewal-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getComplianceRenewalsDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.renewalId) {
    const renewal = await markRenewalComplete(body.renewalId, body.evidence);
    return jsonOk({ renewal });
  }
  const renewal = await scheduleComplianceRenewal({
    controlCode: body.controlCode,
    title: body.title,
    dueAt: new Date(body.dueAt),
  });
  return jsonOk({ renewal }, 201);
}
