import { deliberationDraftSchema, type DeliberationDraft } from "../types/deliberation-draft";

/**
 * Phase A's only model profile is deterministic and offline. Keeping this
 * boundary explicit prevents a provider SDK or network path being introduced
 * as a convenience during synthetic evaluation.
 */
export function parseDeterministicDraft(input: unknown): DeliberationDraft {
  return deliberationDraftSchema.parse(input);
}

export const DETERMINISTIC_MODEL_PROFILE = "DETERMINISTIC_RESEARCH" as const;
