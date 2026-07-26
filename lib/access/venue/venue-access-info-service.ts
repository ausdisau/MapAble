import { prisma } from "@/lib/prisma";

export async function updateVenueAccessInfo(params: {
  placeId: string;
  ownerUserId: string;
  accessInfo: string;
}) {
  return prisma.accessVenueProfile.upsert({
    where: { placeId: params.placeId },
    create: {
      placeId: params.placeId,
      ownerUserId: params.ownerUserId,
      accessInfo: params.accessInfo,
    },
    update: { accessInfo: params.accessInfo },
  });
}
