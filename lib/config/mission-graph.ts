/** Mission Evidence Graph + semantic retrieval flags. All default false. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const missionGraphConfig = {
  get graphEnabled() {
    return envFlag("MAPABLE_MISSION_GRAPH_ENABLED", false);
  },
  get semanticRetrievalEnabled() {
    return envFlag("MAPABLE_SEMANTIC_RETRIEVAL_ENABLED", false);
  },
  get embeddingsEnabled() {
    return envFlag("MAPABLE_EMBEDDINGS_ENABLED", false);
  },
  /** Starting Work only for this wave. */
  allowedMissionKeys: ["mission.starting_work"] as const,
  authorityCeiling: "READ_ONLY_EXPLAIN" as const,
};
