export type SupportTypeId =
  | "all"
  | "personal-care"
  | "transport"
  | "therapy"
  | "employment"
  | "home-help";

export type SupportType = {
  id: SupportTypeId;
  label: string;
  categories: string[];
};

export const SUPPORT_TYPES: SupportType[] = [
  { id: "all", label: "All", categories: [] },
  {
    id: "personal-care",
    label: "Personal care",
    categories: ["Assistance with Daily Life"],
  },
  { id: "transport", label: "Transport", categories: ["Transport"] },
  {
    id: "therapy",
    label: "Therapy",
    categories: ["Therapeutic Supports"],
  },
  {
    id: "employment",
    label: "Employment",
    categories: ["Employment Supports"],
  },
  {
    id: "home-help",
    label: "Home help",
    categories: ["Assistance with Daily Life", "Home Modifications"],
  },
];

export type AccessNeed = {
  id: string;
  label: string;
  keywords: string[];
};

export const ACCESS_NEEDS: AccessNeed[] = [
  { id: "wheelchair", label: "Wheelchair access", keywords: ["wheelchair", "access"] },
  {
    id: "auslan",
    label: "Auslan",
    keywords: ["auslan", "interpreter", "sign language", "deaf"],
  },
  {
    id: "low-sensory",
    label: "Low sensory",
    keywords: ["sensory", "quiet", "sensory-friendly", "low stimulus"],
  },
  {
    id: "hoist",
    label: "Hoist trained",
    keywords: ["hoist", "transfer", "ceiling hoist", "lifting"],
  },
  {
    id: "complex",
    label: "Complex support",
    keywords: ["complex", "high needs", "specialist"],
  },
];

export const FUNDING_OPTIONS = [
  { id: "all", label: "All funding" },
  { id: "ndis", label: "NDIS registered" },
  { id: "private", label: "Private / self-funded" },
] as const;

/** Static fallback when proactive API / DB catalog is unavailable. */
export const HERO_SUGGESTED_SEARCHES_FALLBACK = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration",
  "Low sensory community access support",
  "Employment support with transport",
] as const;

/** @deprecated Use proactive API via `fetchProactiveChipLabels`; kept for imports. */
export const HERO_SUGGESTED_SEARCHES = HERO_SUGGESTED_SEARCHES_FALLBACK;
