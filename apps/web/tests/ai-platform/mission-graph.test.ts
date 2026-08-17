import { afterEach, describe, expect, it } from "vitest";

import {
  answerStartingWorkQuestion,
  buildStartingWorkEvidenceGraph,
  chunksFromEvidenceGraph,
  filterChunksForSecurity,
  hybridRetrieve,
  proposeCandidateEdge,
  requireAiCapability,
} from "@/lib/ai/platform";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";

describe("Mission Evidence Graph", () => {
  afterEach(() => {
    delete process.env.MAPABLE_MISSION_GRAPH_ENABLED;
    delete process.env.MAPABLE_SEMANTIC_RETRIEVAL_ENABLED;
    delete process.env.MAPABLE_EMBEDDINGS_ENABLED;
  });

  it("registers graph and retrieval capabilities as READ_ONLY_EXPLAIN", () => {
    const graph = requireAiCapability("mission.evidence_graph");
    const retrieval = requireAiCapability("mission.semantic_retrieval");
    expect(graph.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
    expect(retrieval.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
    expect(graph.productionClaimStatus).toBe("not_claimable");
  });

  it("builds authoritative Starting Work graph when enabled", () => {
    process.env.MAPABLE_MISSION_GRAPH_ENABLED = "true";
    const state = runGoldenJourney({});
    const graph = buildStartingWorkEvidenceGraph({
      state,
      tenantId: "org-harbour",
      participantScopeId: "taylor",
    });
    expect(graph.missionKey).toBe("mission.starting_work");
    expect(graph.productionClaim).toBe("none");
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.every((e) => e.kind === "authoritative")).toBe(true);
  });

  it("marks candidate edges as requiring human review", () => {
    const edge = proposeCandidateEdge({
      sourceNodeId: "node:care",
      targetNodeId: "node:transport",
      relationship: "possibly_depends",
      evidenceRefs: ["model:guess"],
    });
    expect(edge.kind).toBe("candidate");
    expect(edge.humanReviewRequired).toBe(true);
  });

  it("filters cross-tenant chunks before ranking", () => {
    process.env.MAPABLE_MISSION_GRAPH_ENABLED = "true";
    process.env.MAPABLE_SEMANTIC_RETRIEVAL_ENABLED = "true";
    const state = runGoldenJourney({});
    const graph = buildStartingWorkEvidenceGraph({
      state,
      tenantId: "org-harbour",
      participantScopeId: "taylor",
    });
    const chunks = chunksFromEvidenceGraph(graph, "mission_explain");
    const secure = filterChunksForSecurity(chunks, {
      tenantId: "other-org",
      participantScopeId: "taylor",
      purpose: "mission_explain",
      consentGranted: true,
    });
    expect(secure).toHaveLength(0);

    const noConsent = filterChunksForSecurity(chunks, {
      tenantId: "org-harbour",
      participantScopeId: "taylor",
      purpose: "mission_explain",
      consentGranted: false,
    });
    expect(noConsent).toHaveLength(0);
  });

  it("answers blocking question with citations and no embeddings by default", () => {
    process.env.MAPABLE_MISSION_GRAPH_ENABLED = "true";
    process.env.MAPABLE_SEMANTIC_RETRIEVAL_ENABLED = "true";
    const state = runGoldenJourney({ failureMode: "expired_consent" });
    const graph = buildStartingWorkEvidenceGraph({
      state,
      tenantId: "org-harbour",
      participantScopeId: "taylor",
    });
    const chunks = chunksFromEvidenceGraph(graph, "mission_explain");
    const result = answerStartingWorkQuestion({
      question: "blocking",
      graph,
      chunks,
      ctx: {
        tenantId: "org-harbour",
        participantScopeId: "taylor",
        purpose: "mission_explain",
        consentGranted: true,
      },
    });
    expect(result.filteredBeforeRank).toBe(true);
    expect(result.embeddingsUsed).toBe(false);
    expect(result.hits.every((h) => h.citation.version)).toBeTruthy();
  });

  it("rejects hybrid retrieve when retrieval flag is off", () => {
    process.env.MAPABLE_MISSION_GRAPH_ENABLED = "true";
    const state = runGoldenJourney({});
    const graph = buildStartingWorkEvidenceGraph({
      state,
      tenantId: "org-harbour",
      participantScopeId: "taylor",
    });
    expect(() =>
      hybridRetrieve({
        query: "vehicle",
        graph,
        chunks: chunksFromEvidenceGraph(graph, "mission_explain"),
        ctx: {
          tenantId: "org-harbour",
          participantScopeId: "taylor",
          purpose: "mission_explain",
          consentGranted: true,
        },
      })
    ).toThrow(/MAPABLE_SEMANTIC_RETRIEVAL_ENABLED/);
  });
});
