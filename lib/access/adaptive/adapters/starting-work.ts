import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import { resolvePresentationPolicy } from "../presentation-policy";
import type {
  FamiliarInterfaceState,
  ParticipantAccessProfile,
  SurfaceAdapterResult,
} from "../types";

/** Starting Work mission surface — presentation only; mission state unchanged. */
export function adaptStartingWorkMission(input: {
  profile: ParticipantAccessProfile | null;
  familiarInterface?: FamiliarInterfaceState | null;
}): SurfaceAdapterResult {
  if (!adaptiveAccessConfig.runtimeEnabled) {
    return { surface: "starting_work_mission", policy: null, applied: false };
  }

  const policy = resolvePresentationPolicy({
    route: "/pilot/starting-work",
    component: "StartingWorkMission",
    profile: input.profile,
    deviceCapability: {
      keyboard: true,
      screenReaderLikely: false,
      switchAccess: false,
      voiceControl: false,
      reducedMotionOs: false,
    },
    accessibilitySetting: { textZoomPercent: 100, highContrast: false },
    currentTask: "review_starting_work_mission",
    dataSensitivity: "sensitive",
    familiarInterface: input.familiarInterface ?? null,
  });

  return {
    surface: "starting_work_mission",
    policy,
    applied: policy !== null,
  };
}
