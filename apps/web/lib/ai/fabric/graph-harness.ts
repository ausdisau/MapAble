/**
 * Graph Neural Network harness boundary.
 * Implements ONLY an untrained, deterministic message-passing baseline for
 * structural regression tests. No fitted weights, predictions or clinical
 * meaning; production GNN inference requires an independently reviewed worker.
 */
import { z } from "zod";
import { requireDatasetPurpose } from "./dataset-governance";

const featureVectorSchema = z.tuple([
  z.number().finite(), z.number().finite(), z.number().finite(), z.number().finite()
]);

export const graphNodeSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9_.:-]{3,80}$/),
  kind: z.enum(["place", "access_feature", "transport", "service", "policy", "evidence"]),
  featureVector: featureVectorSchema,
  evidenceRefs: z.array(z.string().min(3).max(100)).max(20),
  status: z.enum(["synthetic", "unverified", "human_reviewed"])
});
export const graphEdgeSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  relation: z.enum(["connects_to", "supports", "depends_on", "contradicts", "documents"]),
  provenanceRefs: z.array(z.string()).max(20)
});
export const graphSnapshotSchema = z.strictObject({
  snapshotId: z.string().min(3),
  datasetId: z.literal("mapable-synthetic-graph-v1"),
  datasetVersion: z.literal("1.0.0"),
  mode: z.literal("synthetic"),
  nodes: z.array(graphNodeSchema).min(1).max(1000),
  edges: z.array(graphEdgeSchema).max(5000),
  publishedAsVerified: z.literal(false)
});

export type ResearchGraph = z.infer<typeof graphSnapshotSchema>;

export function validateResearchGraph(raw: unknown): ResearchGraph {
  const graph = graphSnapshotSchema.parse(raw);
  requireDatasetPurpose({
    datasetId: graph.datasetId, purpose: "synthetic_graph_eval",
    trainingRequested: false, containsPersonData: false
  });
  const ids = graph.nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length) throw new Error("DUPLICATE_GRAPH_NODE");
  const nodes = new Set(ids);
  for (const edge of graph.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) throw new Error("DANGLING_GRAPH_EDGE");
  }
  return graph;
}

export type MessagePassingBaseline = {
  name: "untrained_neighbor_mean_v1";
  snapshotId: string;
  embeddings: Array<{ nodeId: string; values: [number, number, number, number] }>;
  learningPerformed: false;
  productionInference: false;
  actionAuthority: "none";
};

/**
 * One-hop mean of connected neighbour vectors. This is a reproducible graph
 * propagation *baseline*, NOT a trained GNN or accessibility certification.
 */
export function runUntrainedGraphBaseline(raw: unknown): MessagePassingBaseline {
  const graph = validateResearchGraph(raw);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  return {
    name: "untrained_neighbor_mean_v1",
    snapshotId: graph.snapshotId,
    embeddings: graph.nodes.map((node) => {
      const neighbors = graph.edges
        .filter((edge) => edge.from === node.id || edge.to === node.id)
        .map((edge) => byId.get(edge.from === node.id ? edge.to : edge.from))
        .filter((n): n is typeof node => n !== undefined);
      const all = [node, ...neighbors];
      const values = [0, 1, 2, 3].map((i) =>
        all.reduce((sum, n) => sum + n.featureVector[i], 0) / all.length
      ) as [number, number, number, number];
      return { nodeId: node.id, values };
    }),
    learningPerformed: false, productionInference: false, actionAuthority: "none"
  };
}

export const SYNTHETIC_GRAPH_FIXTURE: ResearchGraph = {
  snapshotId: "fixture:access-route-v1",
  datasetId: "mapable-synthetic-graph-v1",
  datasetVersion: "1.0.0", mode: "synthetic", publishedAsVerified: false,
  nodes: [
    { id: "place:fictional", kind: "place", featureVector: [1, 0, 0, 1], evidenceRefs: ["ev:fixture-place"], status: "synthetic" },
    { id: "feature:fictional-lift", kind: "access_feature", featureVector: [0, 1, 0, 1], evidenceRefs: ["ev:fixture-lift"], status: "synthetic" },
    { id: "transport:fictional", kind: "transport", featureVector: [0, 0, 1, 1], evidenceRefs: ["ev:fixture-trip"], status: "synthetic" }
  ],
  edges: [
    { from: "place:fictional", to: "feature:fictional-lift", relation: "depends_on", provenanceRefs: ["ev:fixture-lift"] },
    { from: "transport:fictional", to: "place:fictional", relation: "connects_to", provenanceRefs: ["ev:fixture-trip"] }
  ]
};

export type GraphModelAdapter = {
  readonly adapterId: string;
  readonly modelVersion: string;
  /** External worker only, after human security and model-card review. */
  evaluate(graph: ResearchGraph): Promise<{
    readonly candidateEmbeddingsRef: string;
    readonly modelCardRef: string;
    readonly warnings: readonly string[];
    readonly actionAuthority: "none";
  }>;
};
