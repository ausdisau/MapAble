import { captureLlmGeneration } from "@/lib/analytics/llm-analytics";

export type AiPlatformTelemetryEvent = {
  kind: string;
  capabilityKey: string;
  reason?: string;
  tenantScoped?: boolean;
  latencyMs?: number;
  success?: boolean;
  modelId?: string;
  /** Never include raw participant content. */
};

/**
 * Telemetry adapter — no raw participant content, no secrets.
 * Reuses PostHog LLM analytics when available for generation events.
 */
export function captureAiPlatformTelemetry(
  event: AiPlatformTelemetryEvent
): void {
  if (process.env.NODE_ENV === "test") return;
  if (event.kind === "generation" && event.modelId) {
    captureLlmGeneration({
      traceName: event.capabilityKey,
      model: event.modelId,
      provider: "ai-platform-gateway",
      latencyMs: event.latencyMs ?? 0,
      success: event.success ?? false,
      metadata: {
        kind: event.kind,
        tenant_scoped: event.tenantScoped ?? false,
        reason: event.reason,
      },
    });
  }
}
