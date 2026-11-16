import type { SkillsGapItem } from "@/lib/workforce/skills-gap";

export type LearningRecommendation = {
  id: string;
  title: string;
  kind: "academy_course" | "training_module" | "framework_reference";
  code?: string;
  url?: string;
  mapsToRequirementKeys: string[];
  disclaimer: string;
  highIntensity: boolean;
};

export const FRAMEWORK_REFERENCES: LearningRecommendation[] = [
  {
    id: "ndis-workforce-capability-framework",
    title: "NDIS Workforce Capability Framework (official reference)",
    kind: "framework_reference",
    url: "https://www.ndiscommission.gov.au/workers/ndis-workforce-capability-framework",
    mapsToRequirementKeys: ["safeguarding", "communication_access"],
    disclaimer:
      "Official NDIS Quality and Safeguards Commission publication. Linked, not reproduced. Completing a reading is not demonstrated competence.",
    highIntensity: false,
  },
  {
    id: "ndis-high-intensity-support-skills-descriptors",
    title: "High Intensity Support Skills Descriptors (official reference)",
    kind: "framework_reference",
    url: "https://www.ndiscommission.gov.au/providers/high-intensity-supports",
    mapsToRequirementKeys: ["high_intensity"],
    disclaimer:
      "Official NDIS Commission descriptors. Linked, not reproduced. High-intensity items always require human professional assessment.",
    highIntensity: true,
  },
];

export const ACADEMY_LEARNING: LearningRecommendation[] = [
  {
    id: "academy-safeguarding-101",
    title: "Safeguarding essentials",
    kind: "academy_course",
    code: "SAFEGUARDING-101",
    mapsToRequirementKeys: ["safeguarding", "SAFEGUARDING-101"],
    disclaimer: "Course completion is not verified competency.",
    highIntensity: false,
  },
  {
    id: "academy-accessibility-101",
    title: "Accessible service delivery",
    kind: "academy_course",
    code: "ACCESSIBILITY-101",
    mapsToRequirementKeys: ["communication_access"],
    disclaimer: "Course completion is not verified competency.",
    highIntensity: false,
  },
];

export const PLATFORM_TRAINING: LearningRecommendation[] = [
  {
    id: "training-complaints-handling",
    title: "Complaints handling — NDIS aligned",
    kind: "training_module",
    mapsToRequirementKeys: ["safeguarding"],
    disclaimer: "Platform default module. Training is not competence.",
    highIntensity: false,
  },
];

export function recommendLearning(gaps: SkillsGapItem[]): LearningRecommendation[] {
  const relevantKeys = new Set(
    gaps
      .filter((gap) =>
        gap.state === "training_recommended" ||
        gap.state === "assessment_required" ||
        gap.state === "human_review_required",
      )
      .map((gap) => gap.requirementKey),
  );
  const catalog = [...ACADEMY_LEARNING, ...PLATFORM_TRAINING, ...FRAMEWORK_REFERENCES];
  const matched = catalog.filter((item) =>
    item.mapsToRequirementKeys.some((key) => relevantKeys.has(key)),
  );
  return matched.length > 0 ? matched : ACADEMY_LEARNING;
}

export function learningAvailableWithoutAi(): LearningRecommendation[] {
  return [...ACADEMY_LEARNING, ...PLATFORM_TRAINING, ...FRAMEWORK_REFERENCES];
}
