import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getTransportNetworkRolloutSummary,
  upsertTransportRegion,
} from "@/lib/transport/network-rollout/rollout-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getTransportNetworkRolloutSummary());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const region = await upsertTransportRegion(body);
  return jsonOk({ region }, 201);
}
