import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ availabilityId: string }> }
) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;
  const { availabilityId } = await params;
  const body = await req.json();
  const window = await prisma.availabilityWindow.update({
    where: { id: availabilityId },
    data: {
      startTime: body.startTime,
      endTime: body.endTime,
      active: body.active,
    },
  });
  return jsonOk({ window });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ availabilityId: string }> }
) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;
  const { availabilityId } = await params;
  await prisma.availabilityWindow.update({
    where: { id: availabilityId },
    data: { active: false },
  });
  return jsonOk({ deleted: true });
}
