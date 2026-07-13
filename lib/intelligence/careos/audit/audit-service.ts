import { createAuditEvent } from "@/lib/audit/audit-event-service";

import { careOSFeatureFlags } from "../config/feature-flags";
import type { CareOSContext } from "../context/careos-context";
import { redactCareOSMetadata } from "./redaction";

export type CareOSAuditEvent = {
  action: string;
  agent?: string;
  tool?: string;
  risk?: "read" | "draft" | "write" | "restricted";
  decision?: string;
  metadata?: Record<string, unknown>;
};

export async function auditCareOSEvent(
  context: CareOSContext,
  event: CareOSAuditEvent
): Promise<void> {
  if (!careOSFeatureFlags.auditEnabled) return;
  await createAuditEvent({
    actorUserId: context.actor.userId,
    action: `careos.${event.action}`,
    entityType: "CareOSRequest",
    entityId: context.requestId,
    participantId: context.participant.participantId,
    metadata: redactCareOSMetadata({
      traceId: context.traceId,
      agent: event.agent,
      tool: event.tool,
      risk: event.risk,
      decision: event.decision,
      ...event.metadata,
    }),
  });
}
