import type { NotificationCategory } from "@prisma/client";

/**
 * Journey orchestration stubs for CareOS critical paths.
 * Each stub asserts AI-disabled, confirmation-required behaviour without DB side effects.
 */

export type JourneyOrchestrationResult = {
  journeyId: string;
  aiEnabled: false;
  confirmationRequired: boolean;
  humanReviewRequired: boolean;
  noOperationalChangeMade: true;
  blockedReason?: string;
};

const AI_DISABLED = false as const;
const NO_CHANGE = true as const;

export function orchestrateProviderResponseJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "provider-response-lifecycle",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: true,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Provider accept/decline requires human provider action",
  };
}

export function orchestrateWorkerCancellationRecoveryJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "worker-cancellation-recovery",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: true,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Silent worker substitution forbidden",
  };
}

export function orchestrateShiftNoteDraftJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "shift-note-drafting",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: true,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Shift note assistant disabled — worker review gate required",
  };
}

export function orchestrateMarketplaceDiscoveryJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "marketplace-post-discovery",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: false,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Stops at shortlist — disclosure grant required for next step",
  };
}

export function orchestrateAbilityPayJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "abilitypay-reconciliation",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: true,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Invoice reconciliation requires participant decision",
  };
}

export function orchestrateHomeLivingJourney(): JourneyOrchestrationResult {
  return {
    journeyId: "home-living-proposal",
    aiEnabled: AI_DISABLED,
    confirmationRequired: true,
    humanReviewRequired: true,
    noOperationalChangeMade: NO_CHANGE,
    blockedReason: "Property proposals require safeguarding human queue",
  };
}

export const CRITICAL_JOURNEY_ORCHESTRATORS = [
  orchestrateProviderResponseJourney,
  orchestrateWorkerCancellationRecoveryJourney,
  orchestrateShiftNoteDraftJourney,
  orchestrateMarketplaceDiscoveryJourney,
  orchestrateAbilityPayJourney,
  orchestrateHomeLivingJourney,
] as const;

export function assertJourneySafeDefaults(result: JourneyOrchestrationResult) {
  if (result.aiEnabled) throw new Error("AI must be disabled in journey stub");
  if (!result.confirmationRequired) {
    throw new Error("Confirmation required for critical journeys");
  }
  if (!result.noOperationalChangeMade) {
    throw new Error("Journey stub must not make operational changes");
  }
}

export function notificationPurposeForCategory(
  category: NotificationCategory,
): string {
  return `careos.notification.${category}`;
}
