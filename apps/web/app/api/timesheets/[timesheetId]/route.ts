import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const ts = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!ts) return jsonError("Not found", 404);
  if (
    !isAdminRole(user.primaryRole) &&
    ts.participantId !== user.id
  ) {
    return jsonError("Forbidden", 403);
  }
  const safe = {
    ...ts,
    workerNotes: isAdminRole(user.primaryRole) ? ts.workerNotes : undefined,
  };
  return jsonOk({ timesheet: safe });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const body = await req.json();
  const existing = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
  });
  if (!existing || existing.status !== "draft") {
    return jsonError("Cannot update", 400);
  }
  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      actualStart: body.actualStart ? new Date(body.actualStart) : undefined,
      actualEnd: body.actualEnd ? new Date(body.actualEnd) : undefined,
      breakMinutes: body.breakMinutes,
      workerNotes: body.workerNotes,
      tasksCompleted: body.tasksCompleted,
    },
  });
  return jsonOk({ timesheet: updated });
}
