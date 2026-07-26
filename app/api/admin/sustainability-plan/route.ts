import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createSustainabilityPlan,
  getSustainabilityDashboard,
} from "@/lib/platform/sustainability-plan/sustainability-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getSustainabilityDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const plan = await createSustainabilityPlan(body.title, body.summary);
  return jsonOk({ plan }, 201);
}
