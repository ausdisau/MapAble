import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

function suppressCount(n: number) {
  if (n > 0 && n < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null };
  }
  return { suppressed: false, value: n };
}

export async function getGovernmentPortalSummary(workspaceId: string) {
  if (!phase7Config.governmentPartnerPortalEnabled) {
    return { disabled: true, message: "Government portal not enabled" };
  }

  const ws = await prisma.governmentPartnerWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!ws) throw new Error("NOT_FOUND");

  const [transportCompleted, careCompleted, incidents] = await Promise.all([
    prisma.transportBooking.count({ where: { status: "completed" } }),
    prisma.careShift.count({ where: { status: "completed" } }),
    prisma.incidentReport.groupBy({
      by: ["severity"],
      _count: true,
    }),
  ]);

  return {
    workspace: ws.name,
    region: ws.region,
    transportCompleted: suppressCount(transportCompleted),
    careCompleted: suppressCount(careCompleted),
    incidentsBySeverity: incidents.map((i) => ({
      severity: i.severity,
      count: suppressCount(i._count),
    })),
    disclaimer: "Aggregate data only — no participant-identifiable records.",
  };
}
