import { prisma } from "@/lib/prisma";

export async function registerReleaseCandidate(platform: string, version: string) {
  return prisma.mobileReleaseCandidate.create({
    data: { platform, version },
  });
}

export async function addReleaseBlocker(
  candidateId: string,
  code: string,
  description: string
) {
  return prisma.mobileReleaseBlocker.create({
    data: { candidateId, code, description },
  });
}

export async function getReleaseHardeningStatus() {
  const candidates = await prisma.mobileReleaseCandidate.findMany({
    include: { blockers: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return candidates.map((c) => ({
    ...c,
    ready: c.blockers.every((b) => b.resolved) && c.blockers.length > 0,
  }));
}
