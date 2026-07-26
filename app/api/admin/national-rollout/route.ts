import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getNationalRolloutDashboard,
  upsertRolloutStage,
} from "@/lib/platform/national-rollout/rollout-stage-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getNationalRolloutDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const stage = await upsertRolloutStage(body);
  return jsonOk({ stage }, 201);
}
