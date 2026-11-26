import Anthropic from "@anthropic-ai/sdk";

import {
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import {
  practiceReplySchema,
  readApprovedPracticeReply,
  replySelectionInstructions,
} from "./healthcare-reply-selection";

export async function selectClaudePracticeReply(
  scenario: PracticeScenario,
  apiKey: string,
) {
  const client = new Anthropic({
    apiKey,
    authToken: null,
    baseURL: "https://api.anthropic.com",
    maxRetries: 0,
    timeout: 8_000,
    logLevel: "off",
    fetch: (input, init) =>
      fetch(input, { ...init, redirect: "error", cache: "no-store" }),
  });

  const message = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 256,
    thinking: { type: "disabled" },
    system: replySelectionInstructions,
    messages: [
      { role: "user", content: JSON.stringify(practiceScenarios[scenario]) },
    ],
    output_config: {
      format: { type: "json_schema", schema: practiceReplySchema(scenario) },
    },
  });

  const [reply] = message.content;
  if (
    message.stop_reason !== "end_turn" ||
    message.content.length !== 1 ||
    reply?.type !== "text"
  )
    return undefined;

  return readApprovedPracticeReply(scenario, reply.text);
}
