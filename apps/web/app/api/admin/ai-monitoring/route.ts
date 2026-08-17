import { captureAiMonitoringSnapshot } from "@/lib/ai/monitoring-dashboard/monitoring-snapshot-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const snapshots = await prisma.aiMonitoringDashboardSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return jsonOk({ snapshots });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const snapshot = await captureAiMonitoringSnapshot();
  return jsonOk({ snapshot }, 201);
}
