import {
  UNIFIED_PROHIBITED_USES,
  isUnifiedProhibitedUse,
} from "@/lib/careos/policy/unified-prohibited-uses";

/** @deprecated Prefer UNIFIED_PROHIBITED_USES — kept as CareOS-facing alias (O1). */
export const PROHIBITED_CAREOS_CAPABILITIES = UNIFIED_PROHIBITED_USES;

export type ProhibitedCareOSCapability =
  (typeof PROHIBITED_CAREOS_CAPABILITIES)[number];

export function isProhibitedCareOSCapability(
  capability: string,
): capability is ProhibitedCareOSCapability {
  return isUnifiedProhibitedUse(capability);
}

export function assertCareOSCapabilityAllowed(capability: string): void {
  if (isProhibitedCareOSCapability(capability)) {
    throw new CareOSPolicyError(
      "PROHIBITED_ACTION",
      "This CareOS capability is prohibited and cannot be executed.",
    );
  }
}

export class CareOSPolicyError extends Error {
  constructor(
    public readonly code:
      | "PROHIBITED_ACTION"
      | "AUTHORITY_LEVEL_DENIED"
      | "WRITE_ACTION_DENIED",
    message: string,
  ) {
    super(message);
    this.name = "CareOSPolicyError";
  }
}
