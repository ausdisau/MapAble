import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createGrantReport,
  getGrantReportsDashboard,
  submitGrantReport,
} from "@/lib/reporting/grant/grant-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ reports: await getGrantReportsDashboard() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.reportId) {
    const report = await submitGrantReport(body.reportId);
    return jsonOk({ report });
  }
  const report = await createGrantReport({
    grantCode: body.grantCode,
    periodLabel: body.periodLabel,
    outcomes: body.outcomes ?? {},
  });
  return jsonOk({ report }, 201);
}
