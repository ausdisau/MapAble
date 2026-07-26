import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  generateSlaReport,
  getSlaReportsDashboard,
} from "@/lib/reporting/sla/sla-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ reports: await getSlaReportsDashboard() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const start = body.periodStart
    ? new Date(body.periodStart)
    : new Date(Date.now() - 30 * 86400000);
  const end = body.periodEnd ? new Date(body.periodEnd) : new Date();
  const report = await generateSlaReport(start, end);
  return jsonOk({ report }, 201);
}
