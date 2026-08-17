import { missionGraphConfig } from "@/lib/config/mission-graph";

import type { MissionEvidenceGraph } from "../graph/types";

import type {
  HybridRetrievalHit,
  HybridRetrievalResult,
  SemanticEvidenceChunk,
} from "./types";

export type RetrievalSecurityContext = {
  tenantId: string;
  participantScopeId: string | null;
  purpose: string;
  consentGranted: boolean;
};

/**
 * Build lexical chunks from evidence graph nodes (Starting Work).
 * Embeddings are optional and off by default — never required for retrieval.
 */
export function chunksFromEvidenceGraph(
  graph: MissionEvidenceGraph,
  purpose: string
): SemanticEvidenceChunk[] {
  return graph.nodes.map((node) => ({
    id: `chunk:${node.id}`,
    sourceRecordType: node.entity,
    sourceRecordId: node.entityId,
    sourceVersion: node.version,
    chunkText: node.label,
    redactedText: node.label,
    embeddingModel: null,
    embeddingVersion: null,
    tenantId: node.tenantId,
    participantScopeId: node.participantScopeId,
    purpose,
    expiryIso: null,
    conflictState:
      graph.edges.some(
        (e) =>
          (e.sourceNodeId === node.id || e.targetNodeId === node.id) &&
          e.conflictState === "conflict"
      )
        ? "conflict"
        : "none",
    sourceReliabilityClass:
      node.sourceClassification === "synthetic_fixture"
        ? "synthetic"
        : node.sourceClassification === "model_candidate"
          ? "candidate"
          : "canonical",
  }));
}

/**
 * Security and consent filters run BEFORE ranking — never retrieve broadly then filter.
 */
export function filterChunksForSecurity(
  chunks: SemanticEvidenceChunk[],
  ctx: RetrievalSecurityContext
): SemanticEvidenceChunk[] {
  if (!ctx.consentGranted) return [];
  return chunks.filter((chunk) => {
    if (chunk.tenantId !== ctx.tenantId) return false;
    if (
      ctx.participantScopeId != null &&
      chunk.participantScopeId != null &&
      chunk.participantScopeId !== ctx.participantScopeId
    ) {
      return false;
    }
    if (chunk.purpose !== ctx.purpose && chunk.purpose !== "mission_explain") {
      return false;
    }
    if (chunk.expiryIso && Date.parse(chunk.expiryIso) < Date.now()) {
      return false;
    }
    return true;
  });
}

function keywordScore(text: string, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return 0;
  const hay = text.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (hay.includes(term)) hits += 1;
  }
  return hits / terms.length;
}

function graphBoost(
  chunk: SemanticEvidenceChunk,
  graph: MissionEvidenceGraph,
  query: string
): number {
  const q = query.toLowerCase();
  const node = graph.nodes.find((n) => `chunk:${n.id}` === chunk.id);
  if (!node) return 0;
  let boost = 0;
  if (q.includes("block") && node.label.toLowerCase().includes("block")) {
    boost += 0.4;
  }
  if (q.includes("vehicle") || q.includes("transport")) {
    if (node.domain === "transport") boost += 0.35;
  }
  if (q.includes("equipment") && node.domain === "equipment") boost += 0.35;
  if (q.includes("invoice") && node.domain === "billing") boost += 0.35;
  if (q.includes("access") && node.domain === "access") boost += 0.35;
  if (
    (q.includes("who owns") || q.includes("unresolved") || q.includes("action")) &&
    (node.label.toLowerCase().includes("not_started") ||
      node.label.toLowerCase().includes("blocked"))
  ) {
    boost += 0.3;
  }
  const conflictEdge = graph.edges.find(
    (e) =>
      (e.sourceNodeId === node.id || e.targetNodeId === node.id) &&
      e.conflictState === "conflict"
  );
  if (q.includes("conflict") && conflictEdge) boost += 0.4;
  return boost;
}

/**
 * Hybrid retrieval: tenant/consent filter → keyword + graph traversal.
 * Embeddings only if MAPABLE_EMBEDDINGS_ENABLED (stub returns unused).
 */
export function hybridRetrieve(input: {
  query: string;
  graph: MissionEvidenceGraph;
  chunks: SemanticEvidenceChunk[];
  ctx: RetrievalSecurityContext;
  limit?: number;
}): HybridRetrievalResult {
  if (!missionGraphConfig.semanticRetrievalEnabled) {
    throw new Error("MAPABLE_SEMANTIC_RETRIEVAL_ENABLED is false");
  }
  if (input.graph.missionKey !== "mission.starting_work") {
    throw new Error("Hybrid retrieval scoped to Starting Work only");
  }
  if (input.graph.tenantId !== input.ctx.tenantId) {
    return {
      query: input.query,
      missionKey: input.graph.missionKey,
      hits: [],
      embeddingsUsed: false,
      filteredBeforeRank: true,
      unknowns: ["tenant_mismatch"],
    };
  }

  const secure = filterChunksForSecurity(input.chunks, input.ctx);
  const limit = input.limit ?? 8;
  const hits: HybridRetrievalHit[] = secure
    .map((chunk) => {
      const kw = keywordScore(chunk.redactedText, input.query);
      const graph = graphBoost(chunk, input.graph, input.query);
      const score = kw * 0.6 + graph * 0.4;
      const strategy: HybridRetrievalHit["strategy"] =
        graph > kw ? "graph" : "keyword";
      return {
        chunkId: chunk.id,
        score,
        strategy,
        citation: {
          recordType: chunk.sourceRecordType,
          recordId: chunk.sourceRecordId,
          version: chunk.sourceVersion,
          label: chunk.redactedText,
        },
        text: chunk.redactedText,
      };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const embeddingsUsed = false;
  if (missionGraphConfig.embeddingsEnabled) {
    // Embedding path reserved for a later wave — never ranks without store + delete-on-revoke.
  }

  return {
    query: input.query,
    missionKey: input.graph.missionKey,
    hits,
    embeddingsUsed,
    filteredBeforeRank: true,
    unknowns: hits.length === 0 ? ["no_matching_evidence"] : [],
  };
}

/** Initial Starting Work questions with citations. */
export function answerStartingWorkQuestion(input: {
  question:
    | "blocking"
    | "vehicle_evidence"
    | "equipment_dependents"
    | "what_changed"
    | "invoice_gaps"
    | "access_conflicts"
    | "unresolved_owners";
  graph: MissionEvidenceGraph;
  chunks: SemanticEvidenceChunk[];
  ctx: RetrievalSecurityContext;
}): HybridRetrievalResult {
  const queries: Record<typeof input.question, string> = {
    blocking: "What is still blocking this journey?",
    vehicle_evidence: "Which evidence supports this vehicle requirement?",
    equipment_dependents: "Which services depend on this equipment?",
    what_changed: "What changed after the agreement amendment?",
    invoice_gaps: "Which invoice lines lack delivery evidence?",
    access_conflicts: "Which access claims conflict?",
    unresolved_owners: "Who owns each unresolved action?",
  };
  return hybridRetrieve({
    query: queries[input.question],
    graph: input.graph,
    chunks: input.chunks,
    ctx: input.ctx,
  });
}
