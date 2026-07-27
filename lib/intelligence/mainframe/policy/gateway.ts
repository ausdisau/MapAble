import {
  deliberationDraftSchema,
  type DeliberationDraft,
  type MainframeOutcome,
} from "../types/deliberation-draft";
import { mainframeContextManifestSchema, type MainframeContextManifest } from "../types/mainframe-context";

const prohibitedGoalPattern =
  /diagnos|prescrib|treatment|capacity|restrictive|emergency|funding\s+den|payment|invoice/i;
const instructionPattern =
  /ignore\s+(previous|all)|system\s+prompt|reveal\s+(secret|prompt)|override\s+(policy|consent)/i;

export function evaluateMainframePolicy(params: {
  context: MainframeContextManifest;
  goal: string;
  draft: DeliberationDraft;
}): MainframeOutcome {
  const context = mainframeContextManifestSchema.parse(params.context);
  const draft = deliberationDraftSchema.parse(params.draft);
  if (context.actorAssurance !== "AAL2" && context.actorAssurance !== "AAL3") {
    return deny(draft, "IDENTITY_ASSURANCE_REQUIRED");
  }
  if (prohibitedGoalPattern.test(params.goal)) return deny(draft, "PROHIBITED_GOAL_CATEGORY");
  if (instructionPattern.test(params.goal)) {
    return {
      outcome: "ESCALATE",
      reasonCodes: ["UNTRUSTED_INSTRUCTION_SIGNAL"],
      draft: { ...draft, threatSignals: [...draft.threatSignals, "GOAL_INJECTION_SIGNAL"] },
      humanFallback: "A human coordinator can review the request using verified facts.",
      noActionTaken: true,
    };
  }
  if (draft.draftStatus === "INCOMPLETE" || draft.missingFields.length > 0) {
    return {
      outcome: "CLARIFY",
      reasonCodes: ["ESSENTIAL_INFORMATION_MISSING"],
      draft,
      humanFallback: "You can provide the missing detail or ask a human coordinator for help.",
      noActionTaken: true,
    };
  }
  if (draft.candidateProposals.length === 0) {
    return {
      outcome: "ESCALATE",
      reasonCodes: ["NO_FULLY_ACCESSIBLE_COORDINATED_OPTION"],
      draft,
      humanFallback: "A human coordinator can look for a compliant alternative.",
      noActionTaken: true,
    };
  }
  return {
    outcome: "RECOMMEND",
    reasonCodes: ["COMPLIANT_SYNTHETIC_OPTIONS_AVAILABLE"],
    draft,
    humanFallback: "You can review, reject, or ask a human coordinator to discuss these options.",
    noActionTaken: true,
  };
}

function deny(draft: DeliberationDraft, code: string): MainframeOutcome {
  return {
    outcome: "DENY",
    reasonCodes: [code],
    draft: { ...draft, draftStatus: "DENIED", candidateProposals: [] },
    humanFallback: "This request needs an existing qualified human pathway.",
    noActionTaken: true,
  };
}
