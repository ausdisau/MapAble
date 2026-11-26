import {
  practiceCoachProviders,
  type PracticeCoachProvider,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import {
  isLocalHealthcarePreview,
  isLocalHealthcarePreviewRequest,
} from "./healthcare-local-preview";

const providerIds = Object.keys(
  practiceCoachProviders,
) as PracticeCoachProvider[];

function providerKey(provider: PracticeCoachProvider) {
  if (provider === "claude") {
    return process.env.MAPABLE_HEALTHCARE_CLAUDE_ENABLED === "true"
      ? process.env.ANTHROPIC_API_KEY?.trim()
      : undefined;
  }
  return process.env.MAPABLE_HEALTHCARE_MUSE_ENABLED === "true"
    ? process.env.MODEL_API_KEY?.trim()
    : undefined;
}

export function availableHealthcareCoachProviders(host: string | null) {
  return isLocalHealthcarePreview(host) ? providerIds.filter(providerKey) : [];
}

export function getHealthcareCoachKeys(headers: Headers) {
  if (!isLocalHealthcarePreviewRequest(headers))
    return new Map<PracticeCoachProvider, string>();

  const keys = new Map<PracticeCoachProvider, string>();
  for (const provider of providerIds) {
    const key = providerKey(provider);
    if (key) keys.set(provider, key);
  }
  return keys;
}

export async function selectHealthcareCoachReply(
  provider: PracticeCoachProvider,
  scenario: PracticeScenario,
  apiKey: string,
) {
  if (provider === "claude") {
    const { selectClaudePracticeReply } = await import("./healthcare-claude");
    return selectClaudePracticeReply(scenario, apiKey);
  }
  const { selectMusePracticeReply } = await import("./healthcare-muse");
  return selectMusePracticeReply(scenario, apiKey);
}
