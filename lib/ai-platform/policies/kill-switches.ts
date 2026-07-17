import { aiPlatformConfig } from "@/lib/config/ai-platform";
import { getAiCapability } from "@/lib/ai-platform/capabilities/registry";

const capabilityKill = new Set<string>();
const tenantKill = new Set<string>();

export function engageCapabilityKillSwitch(capabilityKey: string): void {
  capabilityKill.add(capabilityKey);
}

export function clearCapabilityKillSwitch(capabilityKey: string): void {
  capabilityKill.delete(capabilityKey);
}

export function engageTenantKillSwitch(tenantId: string): void {
  tenantKill.add(tenantId);
}

export function clearTenantKillSwitch(tenantId: string): void {
  tenantKill.delete(tenantId);
}

export function isCapabilityKilled(capabilityKey: string): boolean {
  if (aiPlatformConfig.globalKillSwitch) return true;
  if (capabilityKill.has(capabilityKey)) return true;
  const cap = getAiCapability(capabilityKey);
  if (cap && capabilityKill.has(cap.killSwitchKey)) return true;
  return false;
}

export function isTenantKilled(tenantId: string | null | undefined): boolean {
  if (!tenantId) return false;
  return tenantKill.has(tenantId);
}

export function assertModelCallAllowed(input: {
  capabilityKey: string;
  tenantId?: string | null;
}): { allowed: boolean; reason?: string } {
  if (aiPlatformConfig.globalKillSwitch) {
    return { allowed: false, reason: "global_kill_switch" };
  }
  if (!aiPlatformConfig.modelGenerationEnabled && aiPlatformConfig.enabled) {
    return { allowed: false, reason: "model_generation_disabled" };
  }
  if (isCapabilityKilled(input.capabilityKey)) {
    return { allowed: false, reason: "capability_kill_switch" };
  }
  if (isTenantKilled(input.tenantId)) {
    return { allowed: false, reason: "tenant_kill_switch" };
  }
  return { allowed: true };
}
