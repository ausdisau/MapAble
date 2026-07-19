import { createHmac, timingSafeEqual } from "crypto";

import { getN8nConfig, isN8nEnabled } from "@/lib/automation/n8n/n8n-client";
import { redactAutomationPayload } from "@/lib/automation/n8n/n8n-event-publisher";
import { IntegrationSafetyBlockedError } from "@/lib/integrations/integration-error";
import { isAutomationEventAllowed } from "@/lib/integrations/integration-feature-policy";
import { prisma } from "@/lib/prisma";

export function verifyN8nWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  const { webhookSecret } = getN8nConfig();
  if (!webhookSecret || !signature) return false;
  const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function deliverN8nEvent(eventKey: string, payload: Record<string, unknown>) {
  if (!isN8nEnabled()) {
    throw new Error("n8n disabled");
  }
  if (!isAutomationEventAllowed(eventKey)) {
    throw new IntegrationSafetyBlockedError(eventKey);
  }

  const redacted = redactAutomationPayload(payload);
  const hash = JSON.stringify(redacted);

  const event = await prisma.automationWebhookEvent.create({
    data: { eventKey, payloadHash: hash, status: "received" },
  });

  await prisma.automationDelivery.create({
    data: { eventId: event.id, status: "delivered", sentAt: new Date() },
  });

  return { eventId: event.id, payload: redacted };
}
