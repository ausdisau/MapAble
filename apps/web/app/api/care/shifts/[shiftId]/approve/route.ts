import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { approveCareShift } from "@/lib/care/care-shift-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const shift = await prisma.careShift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.participantId !== user.id) {
    return jsonError("Not found", 404);
  }

  const approved = await approveCareShift(shiftId, user.id);
  return jsonOk({ shift: approved });
}
