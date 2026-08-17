import { createHmac, timingSafeEqual } from "crypto";

import { getN8nConfig, isN8nEnabled } from "@/lib/automation/n8n/n8n-client";
import { redactAutomationPayload } from "@/lib/automation/n8n/n8n-event-publisher";
import { IntegrationSafetyBlockedError } from "@/lib/integrations/integration-error";
import { isAutomationEventAllowed } from "@/lib/integrations/integration-feature-policy";
import { prisma } from "@/lib/prisma";

/**
 * Verify an n8n webhook HMAC-SHA256 signature against the raw body.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyN8nWebhookSignature(
  body: string,
  signature: string | null,
  secret: string | undefined = getN8nConfig().webhookSecret
): boolean {
  if (!secret || !signature) return false;

  const provided = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length).trim()
    : signature.trim();
  if (!provided) return false;

  const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
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
