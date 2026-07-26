import type { GroundedAnswer } from "@/lib/ai/platform";

export type MissionCopilotQuestion =
  | "what_happens_next"
  | "what_changed"
  | "what_remains_unknown"
  | "is_worker_ready"
  | "is_vehicle_confirmed"
  | "passport_acknowledged"
  | "what_is_blocked"
  | "what_needs_my_decision"
  | "who_is_responsible"
  | "what_evidence_supports_this"
  | "what_if_dependency_fails"
  | "easy_read"
  | "prepare_provider_questions";

export type MissionCopilotResponse = GroundedAnswer & {
  authorityCeiling: "READ_ONLY_EXPLAIN";
  easyRead?: string;
  checklist?: string[];
  providerQuestions?: string[];
};
