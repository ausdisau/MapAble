import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { draftGovernmentReportPack } from "@/lib/reporting/government/report-pack-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const pack = await draftGovernmentReportPack({
    packType: body.packType ?? "council_summary",
    title: body.title ?? "Draft government report",
    createdById: user.id,
  });
  return jsonOk({ pack });
}
