import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function getLaunchReadinessSummary() {
  const items = await prisma.launchReadinessItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  const ready = items.filter((i) => i.status === "ready" || i.status === "waived").length;
  return {
    total: items.length,
    ready,
    percent: items.length ? Math.round((ready / items.length) * 100) : 0,
    items,
    productionReady: ready === items.length && items.length > 0,
  };
}

export async function completeLaunchItem(
  itemId: string,
  actorUserId: string,
  evidenceDocumentId?: string
) {
  const item = await prisma.launchReadinessItem.update({
    where: { id: itemId },
    data: {
      status: "ready",
      completedAt: new Date(),
      completedById: actorUserId,
      evidenceDocumentId,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "launch_readiness.item_completed",
    entityType: "LaunchReadinessItem",
    entityId: itemId,
  });
  return item;
}

export async function seedDefaultLaunchItems() {
  if (!phase6Config.mobileProductionReadinessEnabled) return;
  const defaults = [
    { code: "MOBILE_A11Y_TEST", category: "mobile", title: "Mobile accessibility test pass" },
    { code: "MOBILE_PRIVACY_LABELS", category: "mobile", title: "App store privacy labels drafted" },
    { code: "DISPATCH_RUNBOOK", category: "operations", title: "Dispatch runbook documented" },
    { code: "INCIDENT_ESCALATION", category: "safeguards", title: "Incident escalation tested" },
    { code: "DR_EXERCISE", category: "resilience", title: "Disaster recovery exercise completed" },
  ];
  for (let i = 0; i < defaults.length; i++) {
    await prisma.launchReadinessItem.upsert({
      where: { code: defaults[i].code },
      create: { ...defaults[i], sortOrder: i },
      update: {},
    });
  }
}
