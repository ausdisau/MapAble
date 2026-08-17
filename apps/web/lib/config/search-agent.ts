/** Provider Finder agent / tool orchestration flags. */

export const searchAgentConfig = {
  /** Use lib/agent/run-agent-turn instead of deterministic plan-provider-finder only. */
  searchAgentEnabled: process.env.SEARCH_AGENT_ENABLED === "true",
  /** Auto-open results when interpretation confidence is high enough. */
  providerFinderAutoShowResults:
    process.env.PROVIDER_FINDER_AUTO_SHOW_RESULTS === "true",
  /** Minimum confidence for auto-show (0–1). */
  providerFinderAutoShowMinConfidence: Number(
    process.env.PROVIDER_FINDER_AUTO_SHOW_MIN_CONFIDENCE ?? "0.75",
  ),
  /** Max NDIS rows returned in Ask responses. */
  providerFinderResultsLimit: Math.min(
    Math.max(Number(process.env.PROVIDER_FINDER_RESULTS_LIMIT ?? "8"), 1),
    25,
  ),
};
