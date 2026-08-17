import { prisma } from "@/lib/prisma";

export async function listContentReports(status = "pending") {
  return prisma.accessContentReport.findMany({
    where: { status: status as never },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
