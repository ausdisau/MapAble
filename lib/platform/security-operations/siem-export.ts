import { redactSensitiveContent } from "@/lib/platform/observability/contracts";
import {
  classifySecurityEvent,
  type SecurityEvent,
  type SiemExportBatch,
} from "@/lib/platform/security-operations/contracts";

export function createSecurityEvent(input: {
  type: string;
  source: string;
  message: string;
  metadata?: Record<string, string>;
}): SecurityEvent {
  return {
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    severity: classifySecurityEvent({ type: input.type, message: input.message }),
    source: input.source,
    message: redactSensitiveContent(input.message),
    occurredAt: new Date().toISOString(),
    metadata: input.metadata
      ? Object.fromEntries(
          Object.entries(input.metadata).map(([k, v]) => [
            k,
            redactSensitiveContent(v),
          ]),
        )
      : undefined,
  };
}

export function exportSiemBatch(events: SecurityEvent[]): SiemExportBatch {
  return {
    events: events.map((e) => ({
      ...e,
      message: redactSensitiveContent(e.message),
    })),
    exportedAt: new Date().toISOString(),
    redacted: true,
  };
}
