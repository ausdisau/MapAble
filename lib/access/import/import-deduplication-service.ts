import { distanceKm } from "@/lib/map/geo";
import { prisma } from "@/lib/prisma";

const PROXIMITY_KM = 0.05;

export async function findDuplicatePlaceCandidates(params: {
  name: string;
  latitude?: number;
  longitude?: number;
  sourceReference?: string;
}) {
  const conflicts: { placeId: string; reason: string }[] = [];

  if (params.sourceReference) {
    const bySource = await prisma.accessPlace.findFirst({
      where: { sourceReference: params.sourceReference },
      select: { id: true, name: true },
    });
    if (bySource) {
      conflicts.push({
        placeId: bySource.id,
        reason: `Same source reference as "${bySource.name}"`,
      });
    }
  }

  const nameMatches = await prisma.accessPlace.findMany({
    where: {
      name: { equals: params.name, mode: "insensitive" },
      status: { not: "archived" },
    },
    include: { location: true },
    take: 10,
  });

  for (const match of nameMatches) {
    if (!params.latitude || !params.longitude || !match.location) {
      conflicts.push({ placeId: match.id, reason: "Same name" });
      continue;
    }
    const dist = distanceKm(
      params.latitude,
      params.longitude,
      match.location.latitude,
      match.location.longitude
    );
    if (dist <= PROXIMITY_KM) {
      conflicts.push({
        placeId: match.id,
        reason: `Name match within ${PROXIMITY_KM}km`,
      });
    }
  }

  return conflicts;
}
