import type {
  ClarificationChoice,
  ClarificationSlot,
  CopilotAgentMeta,
  CopilotProviderResult,
} from "@/lib/copilot/types";
import { ACCESS_NEEDS, SUPPORT_TYPES } from "@/lib/provider/finder/filters";
import type { SearchInterpretation } from "@/types/search";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.55;
export const ACCESS_NEEDS_CLARIFICATION_CONFIDENCE = 0.4;

export function hasUnresolvedAccessNeeds(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.filters.access?.trim()) return false;
  if (interpretation.accessNeedIds.length > 0) return false;
  const resolution = interpretation.accessNeeds;
  if (!resolution) return true;
  return resolution.confidence < ACCESS_NEEDS_CLARIFICATION_CONFIDENCE;
}

export function needsProviderFinderClarification(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.parsed) return false;

  if (hasUnresolvedAccessNeeds(interpretation)) return true;

  if (interpretation.confidence >= CLARIFICATION_CONFIDENCE_THRESHOLD) {
    return false;
  }
  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );
  return !hasLocation || !hasService;
}

export function buildClarificationQuestion(
  interpretation: SearchInterpretation,
): string {
  if (hasUnresolvedAccessNeeds(interpretation)) {
    return "Which access needs matter most — for example wheelchair access, Auslan, low sensory, or hoist support?";
  }

  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );

  if (!hasService) {
    return "What type of support are you looking for — for example occupational therapy, a support worker, or transport?";
  }
  if (!hasLocation) {
    return "Which suburb or postcode should I search near?";
  }
  return "Could you add a bit more detail — suburb or postcode and the type of support you need?";
}

function resolveClarificationSlot(
  interpretation: SearchInterpretation,
): ClarificationSlot {
  if (hasUnresolvedAccessNeeds(interpretation)) return "access";

  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );

  if (!hasService) return "service";
  if (!hasLocation) return "location";
  return "general";
}

export function getFilledSlots(
  interpretation: SearchInterpretation,
): Partial<Record<ClarificationSlot, boolean>> {
  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );
  const hasAccess =
    interpretation.accessNeedIds.length > 0 ||
    (!interpretation.filters.access?.trim() &&
      (interpretation.accessNeeds?.confidence ?? 0) >=
        ACCESS_NEEDS_CLARIFICATION_CONFIDENCE);

  return {
    location: hasLocation,
    service: hasService,
    access: hasAccess,
  };
}

export function getClarificationGuidance(interpretation: SearchInterpretation): {
  clarificationSlot?: ClarificationSlot;
  suggestedChoices?: ClarificationChoice[];
  filledSlots: Partial<Record<ClarificationSlot, boolean>>;
} {
  const filledSlots = getFilledSlots(interpretation);

  if (!needsProviderFinderClarification(interpretation)) {
    return { filledSlots };
  }

  const clarificationSlot = resolveClarificationSlot(interpretation);
  let suggestedChoices: ClarificationChoice[] | undefined;

  if (clarificationSlot === "access") {
    suggestedChoices = ACCESS_NEEDS.map((need) => ({
      label: need.label,
      value: need.label,
    }));
  } else if (clarificationSlot === "service") {
    suggestedChoices = SUPPORT_TYPES.filter((type) => type.id !== "all").map(
      (type) => ({
        label: type.label,
        value: type.label,
      }),
    );
  }

  return {
    clarificationSlot,
    suggestedChoices,
    filledSlots,
  };
}

export function enrichCopilotAgentMeta(
  agent: CopilotAgentMeta,
  interpretation: SearchInterpretation,
  providerResults?: CopilotProviderResult[],
): CopilotAgentMeta {
  const guidance = getClarificationGuidance(interpretation);
  return {
    ...agent,
    ...guidance,
    providerResults:
      agent.status === "complete" ? providerResults : undefined,
  };
}
