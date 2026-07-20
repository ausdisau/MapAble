import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import type { FamiliarInterfaceChoice, FamiliarInterfaceState } from "./types";

export function createFamiliarInterfaceState(input: {
  choice: FamiliarInterfaceChoice;
  frozenLayoutVersion?: string | null;
  previewExpiresAtIso?: string | null;
}): FamiliarInterfaceState {
  return {
    choice: input.choice,
    frozenLayoutVersion: input.frozenLayoutVersion ?? null,
    securityFixesAlwaysApply: true,
    previewExpiresAtIso: input.previewExpiresAtIso ?? null,
  };
}

/**
 * Resolves which layout version to render.
 * Critical security/compliance fixes always apply to frozen interfaces.
 */
export function resolveLayoutVersion(input: {
  latestLayoutVersion: string;
  familiar: FamiliarInterfaceState | null;
  securityPatchVersion: string;
}): {
  layoutVersion: string;
  frozen: boolean;
  securityPatchApplied: string;
  explanation: string;
} {
  if (!adaptiveAccessConfig.familiarInterfaceEnabled || !input.familiar) {
    return {
      layoutVersion: input.latestLayoutVersion,
      frozen: false,
      securityPatchApplied: input.securityPatchVersion,
      explanation: "Familiar interface freeze disabled; using latest layout.",
    };
  }

  switch (input.familiar.choice) {
    case "use_latest":
      return {
        layoutVersion: input.latestLayoutVersion,
        frozen: false,
        securityPatchApplied: input.securityPatchVersion,
        explanation: "Participant chose the latest interface.",
      };
    case "retain_familiar_layout":
      return {
        layoutVersion:
          input.familiar.frozenLayoutVersion ?? input.latestLayoutVersion,
        frozen: true,
        securityPatchApplied: input.securityPatchVersion,
        explanation:
          "Familiar layout retained; security and compliance fixes still apply.",
      };
    case "preview_new_layout":
      return {
        layoutVersion: input.latestLayoutVersion,
        frozen: false,
        securityPatchApplied: input.securityPatchVersion,
        explanation: "Previewing the new layout; participant may revert.",
      };
    case "migrate_with_assistance":
      return {
        layoutVersion:
          input.familiar.frozenLayoutVersion ?? input.latestLayoutVersion,
        frozen: true,
        securityPatchApplied: input.securityPatchVersion,
        explanation:
          "Migration with assistance — familiar layout until assisted migrate completes.",
      };
    default: {
      const _exhaustive: never = input.familiar.choice;
      return _exhaustive;
    }
  }
}
