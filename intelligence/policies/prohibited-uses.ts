import {
  UNIFIED_PROHIBITED_USES,
  isUnifiedProhibitedUse,
} from "@/lib/careos/policy/unified-prohibited-uses";

/** O1 — AI prohibited uses bridged to the unified CareOS registry. */
export const MAPABLE_PROHIBITED_AI_USES = UNIFIED_PROHIBITED_USES;

export type MapAbleProhibitedAiUse =
  (typeof MAPABLE_PROHIBITED_AI_USES)[number];

export function assertPermittedAiUse(use: string) {
  if (isUnifiedProhibitedUse(use)) {
    throw new Error(`MAPABLE_AI_USE_PROHIBITED:${use}`);
  }
}
