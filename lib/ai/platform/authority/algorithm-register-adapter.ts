import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";

/**
 * Adapter to the existing algorithm register — does not duplicate SoR.
 * Returns the capability's algorithm register reference for transparency copy.
 */
export function getAlgorithmRegisterRefForCapability(
  capabilityKey: string
): string | null {
  return getAiCapability(capabilityKey)?.algorithmRegisterRef ?? null;
}

export function capabilityRequiresAlgorithmTransparency(
  capabilityKey: string
): boolean {
  const cap = getAiCapability(capabilityKey);
  if (!cap) return false;
  return (
    cap.backend !== "deterministic" ||
    cap.productionClaimStatus !== "not_claimable"
  );
}
