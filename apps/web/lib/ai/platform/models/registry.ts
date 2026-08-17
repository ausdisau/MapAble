export type ModelRegistration = {
  id: string;
  provider: "ai_gateway" | "google" | "openai_compatible" | "disabled";
  displayName: string;
  allowedTasks: string[];
  maxOutputTokens: number;
  supportsStructuredOutput: boolean;
};

const SHARED_INTERPRETER_TASKS = [
  "search.nl_interpreter",
  "search.access_needs_interpreter",
  "provider_finder.reply_generator",
  "agent.disability_services",
  "agent.booking_services",
  "understanding.contextual",
];

const MODELS: ModelRegistration[] = [
  {
    id: "google/gemini-3.5-flash",
    provider: "ai_gateway",
    displayName: "Gemini 3.5 Flash (gateway)",
    allowedTasks: [...SHARED_INTERPRETER_TASKS],
    maxOutputTokens: 4096,
    supportsStructuredOutput: true,
  },
  {
    id: "openai/gpt-oss-120b",
    provider: "ai_gateway",
    displayName: "gpt-oss-120b (AI Gateway)",
    allowedTasks: [...SHARED_INTERPRETER_TASKS],
    maxOutputTokens: 4096,
    supportsStructuredOutput: true,
  },
  {
    id: "disabled",
    provider: "disabled",
    displayName: "Disabled / deterministic fallback",
    allowedTasks: ["*"],
    maxOutputTokens: 0,
    supportsStructuredOutput: false,
  },
];

export function listModels(): ModelRegistration[] {
  return [...MODELS];
}

export function getModel(id: string): ModelRegistration | undefined {
  return MODELS.find((m) => m.id === id);
}

export function isModelAllowedForTask(modelId: string, task: string): boolean {
  const model = getModel(modelId);
  if (!model) return false;
  if (model.provider === "disabled") return false;
  return model.allowedTasks.includes("*") || model.allowedTasks.includes(task);
}
