import { google } from "@ai-sdk/google";
import { gateway } from "ai";
import type { ZodType } from "zod";

import { requireAiCapability } from "@/lib/ai-platform/capabilities/registry";
import { assertModelCallAllowed } from "@/lib/ai-platform/policies/kill-switches";
import { isModelAllowedForTask } from "@/lib/ai-platform/models/registry";
import { captureAiPlatformTelemetry } from "@/lib/ai-platform/telemetry/adapter";
import { redactSensitiveText } from "@/lib/ai-platform/redaction/sensitive";
import {
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";
import { aiPlatformConfig } from "@/lib/config/ai-platform";

export type GatewayResolveInput = {
  capabilityKey: string;
  tenantId?: string | null;
  taskModelId?: string;
};

export type GatewayResolveResult =
  | {
      ok: true;
      model: ReturnType<typeof gateway> | ReturnType<typeof google>;
      modelId: string;
      engineId: string;
    }
  | { ok: false; reason: string; useDeterministicFallback: boolean };

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}

/**
 * Canonical model gateway. Domain code should resolve models here during migration.
 * Existing interpreter getInterpreterModel remains until call sites migrate.
 */
export function resolveModelForCapability(
  input: GatewayResolveInput
): GatewayResolveResult {
  const cap = requireAiCapability(input.capabilityKey);
  const allow = assertModelCallAllowed({
    capabilityKey: input.capabilityKey,
    tenantId: input.tenantId,
  });
  if (!allow.allowed) {
    captureAiPlatformTelemetry({
      kind: "model_blocked",
      capabilityKey: input.capabilityKey,
      reason: allow.reason,
      tenantScoped: Boolean(input.tenantId),
    });
    return {
      ok: false,
      reason: allow.reason ?? "blocked",
      useDeterministicFallback: true,
    };
  }

  if (cap.backend === "deterministic") {
    return {
      ok: false,
      reason: "capability_is_deterministic",
      useDeterministicFallback: true,
    };
  }

  if (!isSearchInterpreterConfigured() && !aiPlatformConfig.modelGenerationEnabled) {
    return {
      ok: false,
      reason: "model_not_configured",
      useDeterministicFallback: true,
    };
  }

  const modelId =
    input.taskModelId ??
    searchInterpreterConfig.modelId ??
    "google/gemini-3.5-flash";

  if (!isModelAllowedForTask(modelId, input.capabilityKey)) {
    return {
      ok: false,
      reason: "model_not_allowlisted_for_task",
      useDeterministicFallback: true,
    };
  }

  if (searchInterpreterConfig.aiGatewayApiKey) {
    return {
      ok: true,
      model: gateway(modelId),
      modelId,
      engineId: `ai-sdk/gateway/${modelId}`,
    };
  }

  if (searchInterpreterConfig.googleApiKey) {
    return {
      ok: true,
      model: google(stripGooglePrefix(modelId)),
      modelId,
      engineId: `ai-sdk/google/${stripGooglePrefix(modelId)}`,
    };
  }

  return {
    ok: false,
    reason: "no_provider_credentials",
    useDeterministicFallback: true,
  };
}

export type StructuredOutputGuard = {
  schema: ZodType;
  maxInputChars: number;
  maxOutputChars: number;
};

export function guardStructuredInput(
  text: string,
  limits: { maxInputChars: number }
): { ok: true; text: string } | { ok: false; reason: string } {
  if (text.length > limits.maxInputChars) {
    return { ok: false, reason: "input_too_large" };
  }
  const redacted = redactSensitiveText(text);
  if (/ignore (all|previous) instructions/i.test(redacted)) {
    return { ok: false, reason: "prompt_injection_pattern" };
  }
  return { ok: true, text: redacted };
}
