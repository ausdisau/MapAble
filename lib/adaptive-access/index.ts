export { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

export * from "./types";
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
  createFamiliarInterfaceState,
  resolveLayoutVersion,
} from "./familiar-interface";
export {
  assertRequiredTermsPreserved,
  resolvePresentationPolicy,
} from "./presentation-policy";
export { adaptParticipantDashboard } from "./adapters/dashboard";
export { adaptStartingWorkMission } from "./adapters/starting-work";
export { adaptWhatChanged } from "./adapters/what-changed";
export { adaptServiceAgreementReview } from "./adapters/service-agreement";
