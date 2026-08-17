import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { submitTimesheet } from "@/lib/timesheets/timesheet-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiPermission("timesheet:manage:org");
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const ts = await submitTimesheet(timesheetId, user.id);
  return jsonOk({ timesheet: ts });
}
