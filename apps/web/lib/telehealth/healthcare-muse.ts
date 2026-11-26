import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import {
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import {
  isLocalHealthcarePreview,
  isLocalHealthcarePreviewRequest,
} from "./healthcare-local-preview";

const museModel = "muse-spark-1.3";

function museApiKey() {
  return process.env.MAPABLE_HEALTHCARE_MUSE_ENABLED === "true"
    ? process.env.MODEL_API_KEY?.trim()
    : undefined;
}

export function isHealthcareMuseAvailable(host: string | null) {
  return isLocalHealthcarePreview(host) && Boolean(museApiKey());
}

export function getHealthcareMuseRequestKey(headers: Headers) {
  return isLocalHealthcarePreviewRequest(headers) ? museApiKey() : undefined;
}

export async function selectMusePracticeReply(
  scenario: PracticeScenario,
  apiKey: string,
  transport: typeof fetch = fetch,
) {
  const { phrase, replies } = practiceScenarios[scenario];
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

  // The SDK receives only authored text and returns an identifier for an approved reply.
  const result = await provider.chatModel(museModel).doGenerate({
    prompt: [
      {
        role: "system",
        content:
          "Select the approved reply that best respects the speaker's communication choice in a fictional practice conversation. Return only its ID as replyId.",
      },
      {
        role: "user",
        content: [{ type: "text", text: JSON.stringify({ phrase, replies }) }],
      },
    ],
    maxOutputTokens: 256,
    abortSignal: AbortSignal.timeout(8_000),
    responseFormat: {
      type: "json",
      name: "practice_reply",
      schema: {
        type: "object",
        properties: {
          replyId: { type: "string", enum: replies.map(({ id }) => id) },
        },
        required: ["replyId"],
        additionalProperties: false,
      },
    },
  });

  const text = result.content.find((part) => part.type === "text")?.text;
  if (result.finishReason.unified !== "stop" || !text) return undefined;

  const selection: unknown = JSON.parse(text);
  if (
    !selection ||
    typeof selection !== "object" ||
    !("replyId" in selection) ||
    Object.keys(selection).length !== 1
  ) {
    return undefined;
  }

  return replies.find(({ id }) => id === selection.replyId)?.text;
}
