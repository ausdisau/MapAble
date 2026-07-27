export const CAREOS_AUTHORITY_LEVELS = [
  "L0_INFORMATION",
  "L1_DRAFT",
  "L2_RECOMMEND",
  "L3_CONFIRMED_ACTION",
  "L4_ROUTINE_MANDATE",
] as const;

export type CareOSAuthorityLevel = (typeof CAREOS_AUTHORITY_LEVELS)[number];

export type CareOSAction =
  | "read_information"
  | "draft_message"
  | "draft_request"
  | "recommend_mission"
  | "confirmed_action"
  | "routine_mandate"
  | "prohibited";

export const CAREOS_PRODUCTION_CEILING: CareOSAuthorityLevel = "L2_RECOMMEND";

export function classifyCareOSAction(action: CareOSAction): CareOSAuthorityLevel {
  switch (action) {
    case "read_information":
      return "L0_INFORMATION";
    case "draft_message":
    case "draft_request":
      return "L1_DRAFT";
    case "recommend_mission":
      return "L2_RECOMMEND";
    case "confirmed_action":
      return "L3_CONFIRMED_ACTION";
    case "routine_mandate":
      return "L4_ROUTINE_MANDATE";
    case "prohibited":
      return "L4_ROUTINE_MANDATE";
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown CareOS action: ${exhaustive}`);
    }
  }
}

export function isAuthorityLevelAllowed(level: CareOSAuthorityLevel): boolean {
  return CAREOS_AUTHORITY_LEVELS.indexOf(level) <=
    CAREOS_AUTHORITY_LEVELS.indexOf(CAREOS_PRODUCTION_CEILING);
}
