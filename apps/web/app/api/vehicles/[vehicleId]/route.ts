import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return jsonError("Not found", 404);
  return jsonOk({ vehicle });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { vehicleId } = await params;
  const body = await req.json();
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      displayName: body.displayName,
      wheelchairAccessible: body.wheelchairAccessible,
      active: body.active,
    },
  });
  return jsonOk({ vehicle });
}
