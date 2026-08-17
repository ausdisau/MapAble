import type { CareRequestType } from "@prisma/client";

export type CategorySuggestion = {
  supportCategoryCode: string;
  label: string;
  confidence: number;
  requiresHumanReview: boolean;
  rationale: string;
};

const KEYWORD_MAP: Record<string, { codes: string[]; label: string }> = {
  transport: {
    codes: ["transport"],
    label: "Transport (draft mapping)",
  },
  travel: {
    codes: ["transport"],
    label: "Transport (draft mapping)",
  },
  personal: {
    codes: ["daily_life"],
    label: "Assistance with daily life (draft)",
  },
  shower: {
    codes: ["daily_life"],
    label: "Assistance with daily life (draft)",
  },
  meal: {
    codes: ["daily_life"],
    label: "Assistance with daily life (draft)",
  },
  community: {
    codes: ["community_participation"],
    label: "Social and community participation (draft)",
  },
  social: {
    codes: ["community_participation"],
    label: "Social and community participation (draft)",
  },
  therapy: {
    codes: ["therapeutic"],
    label: "Therapeutic supports (draft — review required)",
  },
  behaviour: {
    codes: ["behaviour"],
    label: "Behaviour support (draft — review required)",
  },
};

export function classifySupportCategories(params: {
  message: string;
  requestType: CareRequestType;
  taskNames?: string[];
}): CategorySuggestion[] {
  const text = [
    params.message,
    params.requestType,
    ...(params.taskNames ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const seen = new Set<string>();
  const results: CategorySuggestion[] = [];

  for (const [keyword, mapping] of Object.entries(KEYWORD_MAP)) {
    if (!text.includes(keyword)) continue;
    for (const code of mapping.codes) {
      if (seen.has(code)) continue;
      seen.add(code);
      const requiresHumanReview =
        code === "behaviour" ||
        code === "therapeutic" ||
        params.requestType === "therapy_assistance" ||
        params.requestType === "overnight_support";
      results.push({
        supportCategoryCode: code,
        label: mapping.label,
        confidence: requiresHumanReview ? 0.55 : 0.75,
        requiresHumanReview,
        rationale: `Matched keyword "${keyword}" in your description. This is a draft suggestion only — not an eligibility or funding decision.`,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      supportCategoryCode: "daily_life",
      label: "Assistance with daily life (default draft)",
      confidence: 0.4,
      requiresHumanReview: true,
      rationale:
        "No strong keyword match — a coordinator should confirm the right support category.",
    });
  }

  return results;
}
