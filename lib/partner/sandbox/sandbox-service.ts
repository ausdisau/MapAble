import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function createSandboxApp(name: string, actorUserId: string) {
  if (!phase6Config.partnerSandboxEnabled) {
    throw new Error("SANDBOX_DISABLED");
  }
  const app = await prisma.partnerSandboxApp.create({
    data: {
      name,
      status: "sandbox",
      scopesJson: ["places_read"],
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "partner_sandbox.app_created",
    entityType: "PartnerSandboxApp",
    entityId: app.id,
  });
  return app;
}

export async function testSandboxWebhook(appId: string, eventType: string) {
  const app = await prisma.partnerSandboxApp.findUnique({ where: { id: appId } });
  if (!app) throw new Error("NOT_FOUND");

  return prisma.sandboxWebhookDelivery.create({
    data: {
      appId,
      eventType,
      status: "delivered_placeholder",
    },
  });
}

export function sandboxDataGuard(entityType: string) {
  if (entityType.includes("participant") || entityType.includes("Participant")) {
    throw new Error("PRODUCTION_PARTICIPANT_DATA_BLOCKED_IN_SANDBOX");
  }
}
