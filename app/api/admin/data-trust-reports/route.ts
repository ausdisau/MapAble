import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedAnnualReports,
  publishDataTrustAnnualReport,
} from "@/lib/platform/institutional-permanence/permanence-service";

export async function GET() {
  const user = await requireApiAdminScope("data_trust_report:publish");
  if (user instanceof Response) return user;
  return jsonOk({ reports: await listPublishedAnnualReports() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("data_trust_report:publish");
  if (user instanceof Response) return user;
  const body = await req.json();
  const report = await publishDataTrustAnnualReport({
    yearLabel: body.yearLabel,
    title: body.title,
    summary: body.summary,
    report: body.report ?? {},
    actorUserId: user.id,
  });
  return jsonOk({ report }, 201);
}
