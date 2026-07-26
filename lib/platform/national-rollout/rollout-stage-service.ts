import { prisma } from "@/lib/prisma";

export async function upsertRolloutStage(params: {
  regionCode: string;
  name: string;
  status?: string;
  percentComplete?: number;
}) {
  return prisma.nationalRolloutStage.upsert({
    where: { regionCode: params.regionCode },
    create: {
      regionCode: params.regionCode,
      name: params.name,
      status: params.status ?? "planned",
      percentComplete: params.percentComplete ?? 0,
    },
    update: {
      name: params.name,
      status: params.status,
      percentComplete: params.percentComplete,
    },
  });
}

export async function getNationalRolloutDashboard() {
  const stages = await prisma.nationalRolloutStage.findMany({
    orderBy: { regionCode: "asc" },
  });
  const live = stages.filter((s) => s.status === "live").length;
  return { stages, liveCount: live, total: stages.length };
}
