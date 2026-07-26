import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getLatestStatusPage,
  runPlatformHealthChecks,
} from "@/lib/platform/status/status-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getLatestStatusPage());
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await runPlatformHealthChecks(), 201);
}
