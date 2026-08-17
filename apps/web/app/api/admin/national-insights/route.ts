import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  captureNationalInsightSnapshot,
  listPublishedNationalInsights,
} from "@/lib/research/national-insights/insights-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ snapshots: await listPublishedNationalInsights() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const snapshot = await captureNationalInsightSnapshot(
    body.periodLabel ?? `period-${Date.now()}`
  );
  return jsonOk({ snapshot }, 201);
}
