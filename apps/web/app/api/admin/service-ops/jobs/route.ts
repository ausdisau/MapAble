import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("admin:service-ops");
  if (user instanceof Response) return user;
  const jobs = await prisma.job.findMany({
    where: { status: "draft" },
    take: 50,
  });
  const applications = await prisma.jobApplication.findMany({
    where: {
      reasonableAdjustmentRequest: { not: null },
      shareAdjustments: false,
      status: "submitted",
    },
    include: { job: { select: { title: true } } },
    take: 50,
  });
  return jsonOk({ jobs, applications });
}
