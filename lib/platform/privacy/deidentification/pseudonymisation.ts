import { createHash } from "node:crypto";

const PSEUDONYM_PREFIX = "psn_";

export function pseudonymiseParticipantId(
  participantId: string,
  salt: string,
): string {
  const digest = createHash("sha256")
    .update(`${salt}:${participantId}`)
    .digest("hex")
    .slice(0, 16);
  return `${PSEUDONYM_PREFIX}${digest}`;
}

export function isPseudonym(value: string): boolean {
  return value.startsWith(PSEUDONYM_PREFIX);
}

/**
 * Returns a human-readable de-identification label.
 * Never claims "anonymous" — only describes the applied technique.
 */
export function describeDeidentificationLevel(
  level: "aggregated" | "pseudonymised" | "de-identified",
): string {
  switch (level) {
    case "aggregated":
      return "Aggregated — individual records not included";
    case "pseudonymised":
      return "Pseudonymised — identifiers replaced with irreversible tokens";
    case "de-identified":
      return "De-identified — direct identifiers removed; re-identification risk may remain";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
