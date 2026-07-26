export { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

export * from "./types";
export {
  createFamiliarInterfaceState,
  resolveLayoutVersion,
} from "./familiar-interface";
export {
  AdaptiveAccessError,
  assertAccessProfileEnabled,
  correctAccessProfileField,
  createAccessProfileField,
  createAssistedOnboardingDefaults,
  createParticipantAccessProfile,
  getEffectiveFieldValue,
  revokeAccessProfileField,
} from "./profile";
export {
  assertRequiredTermsPreserved,
  resolvePresentationPolicy,
} from "./presentation-policy";
export { adaptParticipantDashboard } from "./adapters/dashboard";
export { adaptServiceAgreementReview } from "./adapters/service-agreement";
export { adaptStartingWorkMission } from "./adapters/starting-work";
export { adaptWhatChanged } from "./adapters/what-changed";
