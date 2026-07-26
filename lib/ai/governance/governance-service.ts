import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function recordModelMonitorEvent(params: {
  modelVersion: string;
  inputCategory: string;
  outputCategory: string;
  reviewOutcome?: string;
  fairnessWarning?: boolean;
  humanOverride?: boolean;
  actorUserId?: string;
}) {
  if (!phase6Config.aiGovernanceEnabled) return { skipped: true };

  return prisma.aiModelMonitor.create({
    data: {
      modelVersion: params.modelVersion,
      inputCategory: params.inputCategory,
      outputCategory: params.outputCategory,
      reviewOutcome: params.reviewOutcome,
      fairnessWarning: params.fairnessWarning ?? false,
      humanOverride: params.humanOverride ?? false,
      actorUserId: params.actorUserId,
    },
  });
}

export async function recordAiGovernanceIncident(params: {
  summary: string;
  severity?: string;
  monitorId?: string;
  actorUserId: string;
}) {
  const incident = await prisma.aiGovernanceIncident.create({
    data: {
      monitorId: params.monitorId,
      summary: params.summary,
      severity: params.severity ?? "medium",
    },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "ai_governance.incident_recorded",
    entityType: "AiGovernanceIncident",
    entityId: incident.id,
  });
  return incident;
}

export async function getAiGovernanceDashboard() {
  const [monitors, incidents, fairnessChecks] = await Promise.all([
    prisma.aiModelMonitor.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.aiGovernanceIncident.findMany({
      where: { status: "open" },
      take: 20,
    }),
    prisma.fairnessCheck.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return { monitors, incidents, fairnessWarningCount: monitors.filter((m) => m.fairnessWarning).length, fairnessChecks };
}
