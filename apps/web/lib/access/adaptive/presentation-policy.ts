import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import { resolveLayoutVersion } from "./familiar-interface";
import { getEffectiveFieldValue } from "./profile";
import type {
  AdaptiveMode,
  ContentRendition,
  InformationDensity,
  PresentationPolicyInput,
  PresentationPolicyOutput,
} from "./types";

/**
 * Resolves presentation without altering legal, financial, clinical, or operational meaning.
 * Never selects options for the participant or reorders choices to manipulate decisions.
 */
export function resolvePresentationPolicy(
  input: PresentationPolicyInput,
  nowIso = new Date().toISOString()
): PresentationPolicyOutput | null {
  if (!adaptiveAccessConfig.runtimeEnabled) {
    return null;
  }

  const profile = input.profile;
  const modes: AdaptiveMode[] = ["standard"];

  const plain =
    profile &&
    getEffectiveFieldValue<boolean>(profile, "plainLanguagePreference", nowIso);
  const easyRead =
    profile &&
    getEffectiveFieldValue<boolean>(profile, "easyReadPreference", nowIso);
  const oneQ =
    profile &&
    getEffectiveFieldValue<boolean>(profile, "oneQuestionAtATime", nowIso);
  const density =
    (profile &&
      getEffectiveFieldValue<InformationDensity>(
        profile,
        "informationDensity",
        nowIso
      )) ??
    "medium";
  const reducedMotionPref =
    (profile &&
      getEffectiveFieldValue<boolean>(profile, "reducedMotion", nowIso)) ??
    false;
  const largeControl =
    (profile &&
      getEffectiveFieldValue<string>(profile, "controlSize", nowIso)) ===
    "large";
  const screenReader =
    (profile &&
      getEffectiveFieldValue<boolean>(
        profile,
        "screenReaderOptimisation",
        nowIso
      )) ||
    input.deviceCapability.screenReaderLikely;
  const switchAccess =
    (profile &&
      getEffectiveFieldValue<boolean>(profile, "switchAccessMode", nowIso)) ||
    input.deviceCapability.switchAccess;
  const voiceAccess =
    (profile &&
      getEffectiveFieldValue<boolean>(profile, "voiceControlMode", nowIso)) ||
    input.deviceCapability.voiceControl;
  const aac =
    profile &&
    getEffectiveFieldValue<boolean>(profile, "aacFriendlyPhrasing", nowIso);
  const responseExt =
    (profile &&
      getEffectiveFieldValue<number>(
        profile,
        "responseTimeExtension",
        nowIso
      )) ??
    0;
  const timeoutWarning =
    (profile &&
      getEffectiveFieldValue<boolean>(
        profile,
        "timeoutWarningPreference",
        nowIso
      )) ??
    true;

  if (plain) modes.push("plain_language");
  if (
    easyRead &&
    adaptiveAccessConfig.easyReadPresentationEnabled
  ) {
    modes.push("easy_read_draft");
  }
  if (oneQ) modes.push("one_question_at_a_time");
  if (density === "low") modes.push("low_information_density");
  if (screenReader) modes.push("screen_reader_optimised");
  if (switchAccess) modes.push("switch_access");
  if (voiceAccess) modes.push("voice_access");
  if (aac) modes.push("aac_friendly");
  if (largeControl || input.accessibilitySetting.textZoomPercent >= 200) {
    modes.push("large_target");
  }
  if (reducedMotionPref || input.deviceCapability.reducedMotionOs) {
    modes.push("reduced_motion");
  }

  const layout = resolveLayoutVersion({
    latestLayoutVersion: "dashboard.v2",
    familiar: input.familiarInterface,
    securityPatchVersion: "security.current",
  });
  if (layout.frozen) modes.push("familiar_interface");

  let contentRendition: ContentRendition = "standard";
  if (aac) contentRendition = "aac_friendly";
  else if (easyRead && adaptiveAccessConfig.easyReadPresentationEnabled) {
    contentRendition = "easy_read_draft";
  } else if (plain) contentRendition = "plain_language";

  const componentVariant = [
    input.component,
    density === "low" ? "density-low" : null,
    largeControl ? "controls-large" : null,
    layout.frozen ? `layout-${layout.layoutVersion}` : null,
  ]
    .filter(Boolean)
    .join("__");

  return {
    componentVariant,
    contentRendition,
    activeModes: modes,
    navigationMode: oneQ ? "one_question" : "standard",
    interactionTiming: {
      responseExtensionSeconds: Math.max(0, Number(responseExt) || 0),
      timeoutWarning: Boolean(timeoutWarning),
    },
    informationDensity: density,
    controlSize: largeControl ? "large" : "standard",
    reducedMotion: reducedMotionPref || input.deviceCapability.reducedMotionOs,
    fallback: "standard_non_ai_pathway",
    explanation: buildExplanation(modes, input, layout.explanation),
    meaningPreservation: {
      requiredTermsRetained: true,
      optionsNotReorderedForPersuasion: true,
      noSilentPreferenceReset: true,
    },
  };
}

function buildExplanation(
  modes: AdaptiveMode[],
  input: PresentationPolicyInput,
  layoutExplanation: string
): string {
  const modeList = modes.filter((m) => m !== "standard").join(", ") || "none";
  return [
    `Presentation policy for ${input.route}/${input.component}.`,
    `Active modes: ${modeList}.`,
    layoutExplanation,
    "Required legal and operational terms are retained.",
    "Choices are not reordered to persuade.",
    `Task: ${input.currentTask}; sensitivity: ${input.dataSensitivity}.`,
  ].join(" ");
}

/**
 * Guards against meaning alteration: required terms must appear in rendered text.
 */
export function assertRequiredTermsPreserved(input: {
  originalText: string;
  renderedText: string;
  requiredTerms: string[];
}): { ok: true } | { ok: false; missing: string[] } {
  const missing = input.requiredTerms.filter(
    (term) =>
      input.originalText.includes(term) && !input.renderedText.includes(term)
  );
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}
