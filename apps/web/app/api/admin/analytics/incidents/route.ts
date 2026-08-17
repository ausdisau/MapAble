import { getIncidentAnalytics } from "@/lib/analytics/admin-analytics-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const data = await getIncidentAnalytics();
  return jsonOk(data);
}
