import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import {
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import {
  practiceReplySchema,
  readApprovedPracticeReply,
  replySelectionInstructions,
} from "./healthcare-reply-selection";

const museModel = "muse-spark-1.3";

export async function selectMusePracticeReply(
  scenario: PracticeScenario,
  apiKey: string,
  transport: typeof fetch = fetch,
) {
  const provider = createOpenAICompatible({
    name: "meta-model-api",
    baseURL: "https://api.meta.ai/v1",
    apiKey,
    fetch: (input, init) => transport(input, { ...init, redirect: "error" }),
    supportsStructuredOutputs: true,
    transformRequestBody: ({ max_tokens, ...body }) => ({
      ...body,
      max_completion_tokens: max_tokens,
      reasoning_effort: "minimal",
    }),
  });

  const result = await provider.chatModel(museModel).doGenerate({
    prompt: [
      { role: "system", content: replySelectionInstructions },
      {
        role: "user",
        content: [
          { type: "text", text: JSON.stringify(practiceScenarios[scenario]) },
        ],
      },
    ],
    maxOutputTokens: 256,
    abortSignal: AbortSignal.timeout(8_000),
    responseFormat: {
      type: "json",
      name: "practice_reply",
      schema: practiceReplySchema(scenario),
    },
  });

  const text = result.content.find((part) => part.type === "text")?.text;
  if (result.finishReason.unified !== "stop" || !text) return undefined;

  return readApprovedPracticeReply(scenario, text);
}
