import { getAnalyticsSummary } from "@/lib/analytics/admin-analytics-service";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET(req: Request) {
  const user = await requireApiPermission("admin:analytics");
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const summary = await getAnalyticsSummary(
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined
  );
  return jsonOk({ summary });
}
