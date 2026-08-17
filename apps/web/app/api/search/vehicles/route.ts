import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const wheelchair = searchParams.get("wheelchair") === "true";
  const vehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      ...(wheelchair ? { wheelchairAccessible: true } : {}),
    },
    select: {
      id: true,
      displayName: true,
      wheelchairAccessible: true,
      rampAvailable: true,
      liftAvailable: true,
      assistanceAnimalFriendly: true,
      organisationId: true,
      verificationStatus: true,
    },
    take: 50,
  });
  return jsonOk({ results: vehicles });
}
