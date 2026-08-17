import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import {
  getCsatAverage,
  getPlatformNpsBenchmark,
} from "@/lib/engagement/nps-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [nps, csat, complaintStats, improvementCount] = await Promise.all([
    getPlatformNpsBenchmark(since),
    getCsatAverage(undefined, since),
    prisma.engagementSubmission.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.engagementImprovementAction.count({
      where: { createdAt: { gte: since } },
    }),
  ]);

  return jsonOk({
    since,
    nps,
    csat,
    submissionsByType: complaintStats,
    improvementActions: improvementCount,
  });
}
