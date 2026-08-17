import { prisma } from "@/lib/prisma";

export async function registerAssessorNetworkMember(params: {
  userId: string;
  credential?: string;
  regions?: string[];
}) {
  return prisma.assessorNetworkMember.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      credential: params.credential,
      regions: params.regions ?? [],
      status: "active",
    },
    update: {
      credential: params.credential,
      regions: params.regions,
    },
  });
}

export async function getAssessorNetworkDirectory() {
  return prisma.assessorNetworkMember.findMany({
    where: { status: "active" },
    orderBy: { joinedAt: "desc" },
    take: 100,
  });
}
