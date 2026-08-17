import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { generateBoardReport } from "@/lib/reporting/board/board-report-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const report = await generateBoardReport(
    user.id,
    body.reportPeriod ?? new Date().toISOString().slice(0, 7)
  );
  return jsonOk({ report });
}
