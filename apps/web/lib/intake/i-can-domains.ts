import {
  ICAN_V6_DOMAIN_IDS,
  type ICanV6DomainId,
} from "@/lib/validation/i-can-v6";

export type ICanV6DomainMeta = {
  id: ICanV6DomainId;
  label: string;
  description: string;
};

export const ICAN_V6_DOMAIN_META: readonly ICanV6DomainMeta[] = [
  {
    id: "communication",
    label: "Communication",
    description:
      "How you understand others and express yourself, including speech, AAC, Auslan, and written communication.",
  },
  {
    id: "mobility",
    label: "Mobility",
    description:
      "Moving around at home and in the community, transfers, and use of mobility aids.",
  },
  {
    id: "self_care",
    label: "Self-care",
    description:
      "Personal care such as washing, dressing, eating, drinking, and toileting.",
  },
  {
    id: "domestic_life",
    label: "Domestic life",
    description:
      "Household tasks including meals, cleaning, shopping, and looking after your home.",
  },
  {
    id: "interpersonal_interactions",
    label: "Interpersonal interactions",
    description:
      "Relationships with family, friends, support workers, and people in the community.",
  },
  {
    id: "learning_and_applying_knowledge",
    label: "Learning and applying knowledge",
    description:
      "Learning new skills, remembering information, and applying knowledge day to day.",
  },
  {
    id: "general_tasks_and_demands",
    label: "General tasks and demands",
    description:
      "Planning, organising, managing time, and handling multiple tasks or stress.",
  },
  {
    id: "education",
    label: "Education",
    description:
      "Participating in school, TAFE, university, or other learning settings.",
  },
  {
    id: "community_social_civic_life",
    label: "Community, social and civic life",
    description:
      "Taking part in community, recreation, cultural, and civic activities.",
  },
  {
    id: "work_and_employment",
    label: "Work and employment",
    description:
      "Finding, keeping, and participating in paid or voluntary work.",
  },
  {
    id: "economic_life",
    label: "Economic life",
    description:
      "Managing money, bills, banking, and economic transactions with support as needed.",
  },
  {
    id: "looking_after_ones_health",
    label: "Looking after one's health",
    description:
      "Managing health, medication prompts, appointments, and wellbeing routines.",
  },
] as const;

export function getICanV6DomainMeta(
  id: ICanV6DomainId,
): ICanV6DomainMeta | undefined {
  return ICAN_V6_DOMAIN_META.find((d) => d.id === id);
}

export function assertAllDomainsCovered(): void {
  const ids = new Set(ICAN_V6_DOMAIN_META.map((d) => d.id));
  for (const id of ICAN_V6_DOMAIN_IDS) {
    if (!ids.has(id)) {
      throw new Error(`Missing I-CAN v6 domain metadata for ${id}`);
    }
  }
}
