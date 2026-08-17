import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createTimesheetFromCareShift } from "@/lib/timesheets/timesheet-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiPermission("timesheet:manage:org");
  if (user instanceof Response) return user;
  const { shiftId } = await params;
  const timesheet = await createTimesheetFromCareShift(shiftId, user.id);
  return jsonOk({ timesheet }, 201);
}
