import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildWorkerParticipantView } from "@/lib/care/care-participant-info";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true, workerProfile: true },
  });
  if (!shift) return jsonError("Shift not found", 404);

  if (
    shift.workerProfile?.userId !== user.id &&
    user.primaryRole !== "mapable_admin" &&
    user.primaryRole !== "provider_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  const brief = await buildWorkerParticipantView(user, shift.careRequest, shift);
  return jsonOk({ brief });
}
