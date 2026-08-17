import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { disputeTimesheet } from "@/lib/timesheets/timesheet-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiPermission("timesheet:approve:self");
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const body = await req.json();
  const ts = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!ts || ts.participantId !== user.id) return jsonError("Not found", 404);
  const updated = await disputeTimesheet(
    timesheetId,
    user.id,
    body.reason ?? "Participant disputed this record"
  );
  return jsonOk({ timesheet: updated });
}
