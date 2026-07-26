import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import { resolvePresentationPolicy } from "../presentation-policy";
import type {
  FamiliarInterfaceState,
  ParticipantAccessProfile,
  SurfaceAdapterResult,
} from "../types";

/**
 * Participant dashboard presentation adapter.
 * Does not change billing, consent, or booking meaning — layout/density only.
 */
export function adaptParticipantDashboard(input: {
  profile: ParticipantAccessProfile | null;
  familiarInterface?: FamiliarInterfaceState | null;
  textZoomPercent?: number;
}): SurfaceAdapterResult {
  if (!adaptiveAccessConfig.runtimeEnabled) {
    return { surface: "participant_dashboard", policy: null, applied: false };
  }

  const policy = resolvePresentationPolicy({
    route: "/dashboard",
    component: "ParticipantDashboard",
    profile: input.profile,
    deviceCapability: {
      keyboard: true,
      screenReaderLikely: false,
      switchAccess: false,
      voiceControl: false,
      reducedMotionOs: false,
    },
    accessibilitySetting: {
      textZoomPercent: input.textZoomPercent ?? 100,
      highContrast: false,
    },
    currentTask: "browse_control_panel",
    dataSensitivity: "operational",
    familiarInterface: input.familiarInterface ?? null,
  });

  return {
    surface: "participant_dashboard",
    policy,
    applied: policy !== null,
  };
}
