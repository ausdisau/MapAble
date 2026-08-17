import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  assertCanMutateCareShift,
  assertCanViewCareShift,
  CareAccessError,
} from "@/lib/care/access-control";
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
  if (!shift) return jsonError("Not found", 404);

  try {
    await assertCanViewCareShift(user, shift);
  } catch (e) {
    if (e instanceof CareAccessError) {
      return jsonError(e.message, e.code === "NOT_FOUND" ? 404 : 403);
    }
    throw e;
  }

  return jsonOk({ shift });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const existing = await prisma.careShift.findUnique({
    where: { id: shiftId },
  });
  if (!existing) return jsonError("Not found", 404);

  try {
    await assertCanMutateCareShift(user, existing);
  } catch (e) {
    if (e instanceof CareAccessError) {
      return jsonError(e.message, 403);
    }
    throw e;
  }

  const body = await req.json();
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      workerProfileId: body.workerProfileId,
      status: body.status,
      workerNotes: body.workerNotes,
    },
  });
  return jsonOk({ shift });
}
