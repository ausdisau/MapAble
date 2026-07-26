import { prisma } from "@/lib/prisma";

const memoryCache = new Map<string, { estimateId: string; expiresAt: number }>();

export function buildRouteCacheKey(parts: {
  provider: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  return `${parts.provider}:${parts.origin.lat},${parts.origin.lng}:${parts.destination.lat},${parts.destination.lng}`;
}

export async function getCachedEstimate(cacheKey: string) {
  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > Date.now()) {
    return prisma.transportRouteEstimate.findUnique({
      where: { id: mem.estimateId },
    });
  }
  return prisma.transportRouteEstimate.findFirst({
    where: { cacheKey },
    orderBy: { createdAt: "desc" },
  });
}

export function rememberEstimate(cacheKey: string, estimateId: string) {
  memoryCache.set(cacheKey, {
    estimateId,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });
}

export async function refreshRouteCache(params: {
  cacheKey?: string;
  tripId?: string;
}) {
  if (params.cacheKey) memoryCache.delete(params.cacheKey);
  if (params.tripId) {
    await prisma.transportRouteEstimate.deleteMany({
      where: { tripId: params.tripId },
    });
  }
  return { refreshed: true };
}
