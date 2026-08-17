import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("driver:trips");
  if (user instanceof Response) return user;

  const driver = await prisma.driverProfile.findFirst({
    where: { userId: user.id },
  });

  const trips = await prisma.transportBooking.findMany({
    where: driver ? { driverProfileId: driver.id } : { id: "none" },
    orderBy: { pickupWindowStart: "asc" },
    take: 20,
  });

  return jsonOk({ trips });
}
