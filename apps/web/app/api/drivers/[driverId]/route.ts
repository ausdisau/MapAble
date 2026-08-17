import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { driverId } = await params;
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      displayName: true,
      serviceRegions: true,
      verificationStatus: true,
      active: true,
      organisationId: true,
    },
  });
  if (!driver) return jsonError("Not found", 404);
  return jsonOk({ driver });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { driverId } = await params;
  const body = await req.json();
  const driver = await prisma.driverProfile.update({
    where: { id: driverId },
    data: { displayName: body.displayName, active: body.active },
  });
  return jsonOk({ driver });
}
