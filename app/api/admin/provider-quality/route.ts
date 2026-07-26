import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  calculateProviderQualityScore,
  getProviderQualityDashboard,
} from "@/lib/provider/quality/quality-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getProviderQualityDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.organisationId) return jsonError("organisationId required", 400);
  return jsonOk(
    await calculateProviderQualityScore(body.organisationId)
  );
}
