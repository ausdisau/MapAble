/** AI SDK ToolLoopAgent for agentic disability services (provider finder). */

export const disabilityServicesAgentConfig = {
  enabled: process.env.DISABILITY_SERVICES_AGENT_ENABLED === "true",
  maxSteps: Math.min(
    Math.max(Number(process.env.DISABILITY_SERVICES_AGENT_MAX_STEPS ?? "6"), 1),
    12,
  ),
  resultsLimit: Math.min(
    Math.max(Number(process.env.PROVIDER_FINDER_RESULTS_LIMIT ?? "8"), 1),
    25,
  ),
};

export function isDisabilityServicesAgentConfigured(): boolean {
  return process.env.DISABILITY_SERVICES_AGENT_ENABLED === "true";
}
