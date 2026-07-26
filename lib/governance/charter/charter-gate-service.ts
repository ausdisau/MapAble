import { y4CivicPlatformConfig } from "@/lib/config/y4-civic-platform";
import { getActiveCharter } from "@/lib/governance/charter/charter-service";

export async function requireRatifiedCharter() {
  if (!y4CivicPlatformConfig.governanceCharterGateEnabled) {
    return null;
  }

  const charter = await getActiveCharter();
  if (!charter) {
    throw new Error("CHARTER_NOT_RATIFIED");
  }

  return charter;
}

export async function isCharterGateActive() {
  return y4CivicPlatformConfig.governanceCharterGateEnabled;
}
