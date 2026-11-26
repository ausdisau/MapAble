import {
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

export const replySelectionInstructions =
  "Select the approved reply that best respects the speaker's communication choice in a fictional practice conversation. Return only its ID as replyId.";

export function practiceReplySchema(scenario: PracticeScenario) {
  return {
    type: "object" as const,
    properties: {
      replyId: {
        type: "string" as const,
        enum: practiceScenarios[scenario].replies.map(({ id }) => id),
      },
    },
    required: ["replyId"],
    additionalProperties: false,
  };
}

export function readApprovedPracticeReply(
  scenario: PracticeScenario,
  output: string,
) {
  let selection: unknown;
  try {
    selection = JSON.parse(output);
  } catch {
    return undefined;
  }

  if (
    !selection ||
    typeof selection !== "object" ||
    !("replyId" in selection) ||
    Object.keys(selection).length !== 1
  ) {
    return undefined;
  }

  return practiceScenarios[scenario].replies.find(
    ({ id }) => id === selection.replyId,
  )?.text;
}
