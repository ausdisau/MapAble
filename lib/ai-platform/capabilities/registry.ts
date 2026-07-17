import type { AiCapabilityRegistration } from "./types";
import { SEEDED_CAPABILITIES } from "./seed";

const byKey = new Map<string, AiCapabilityRegistration>(
  SEEDED_CAPABILITIES.map((c) => [c.key, c])
);

export function listAiCapabilities(): AiCapabilityRegistration[] {
  return [...byKey.values()];
}

export function getAiCapability(
  key: string
): AiCapabilityRegistration | undefined {
  return byKey.get(key);
}

export function requireAiCapability(key: string): AiCapabilityRegistration {
  const cap = byKey.get(key);
  if (!cap) {
    throw new Error(`AI_CAPABILITY_NOT_REGISTERED:${key}`);
  }
  return cap;
}

export function listModelBackedCapabilities(): AiCapabilityRegistration[] {
  return listAiCapabilities().filter(
    (c) => c.backend === "model_backed" || c.backend === "hybrid"
  );
}

export function listDeterministicCapabilities(): AiCapabilityRegistration[] {
  return listAiCapabilities().filter((c) => c.backend === "deterministic");
}

/** Public description must not claim model-backed AI unless a real model is invoked. */
export function assertHonestPublicLabel(cap: AiCapabilityRegistration): {
  ok: boolean;
  reason?: string;
} {
  if (
    cap.backend === "deterministic" &&
    cap.productionClaimStatus === "public_allowed"
  ) {
    return {
      ok: false,
      reason: "Deterministic capabilities must not be publicly claimed as model-backed AI.",
    };
  }
  if (cap.backend !== "deterministic" && !cap.modelIdentifier) {
    return {
      ok: false,
      reason: "Model-backed/hybrid capabilities require a modelIdentifier.",
    };
  }
  return { ok: true };
}
