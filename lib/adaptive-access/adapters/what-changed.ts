import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import { resolvePresentationPolicy } from "../presentation-policy";
import type {
  FamiliarInterfaceState,
  ParticipantAccessProfile,
  SurfaceAdapterResult,
} from "../types";

/**
 * What Changed surface adapter.
 * Diff content remains deterministic from Mission Portfolio — only presentation changes.
 */
export function adaptWhatChanged(input: {
  profile: ParticipantAccessProfile | null;
  familiarInterface?: FamiliarInterfaceState | null;
}): SurfaceAdapterResult {
  if (!adaptiveAccessConfig.runtimeEnabled) {
    return { surface: "what_changed", policy: null, applied: false };
  }

  const policy = resolvePresentationPolicy({
    route: "/missions/what-changed",
    component: "WhatChangedList",
    profile: input.profile,
    deviceCapability: {
      keyboard: true,
      screenReaderLikely: false,
      switchAccess: false,
      voiceControl: false,
      reducedMotionOs: false,
    },
    accessibilitySetting: { textZoomPercent: 100, highContrast: false },
    currentTask: "review_mission_changes",
    dataSensitivity: "operational",
    familiarInterface: input.familiarInterface ?? null,
  });

  return {
    surface: "what_changed",
    policy,
    applied: policy !== null,
  };
}
