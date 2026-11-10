/**
 * Frame for Thought (FfT) is an inspectable EVIDENCE LEDGER, not private chain
 * of thought. It records observable claims, supporting/contrary evidence,
 * uncertainty and human review. It never grants action authority.
 */
import { z } from "zod";
import { validateResearchGraph } from "./graph-harness";

export const frameForThoughtSchema = z.strictObject({
  frameId: z.string().uuid(),
  schemaVersion: z.literal("1.0.0"),
  graphSnapshotId: z.string().min(3),
  datasetId: z.literal("mapable-synthetic-graph-v1"),
  createdAt: z.string().datetime(),
  questionSummary: z.string().trim().min(5).max(400),
  /**
   * Plain-language rationale derived from cited evidence, not an attempt
   * to reconstruct model-internal hidden reasoning.
   */
  evidenceSummary: z.string().trim().min(5).max(600),
  proposedInterpretation: z.string().trim().min(5).max(600),
  supportingEvidenceRefs: z.array(z.string().min(3)).max(20),
  contradictingEvidenceRefs: z.array(z.string().min(3)).max(20),
  unknowns: z.array(z.string().min(3)).min(1).max(30),
  alternativeExplanations: z.array(z.string().min(3)).min(1).max(10),
  modalityDescriptorRefs: z.array(z.string().min(3)).max(12),
  reviewStatus: z.literal("human_review_required"),
  regulatoryEffect: z.literal("none"),
  actionAuthority: z.literal("none"),
  publishAsVerified: z.literal(false),
  sourceIsSynthetic: z.literal(true)
});

export type FrameForThought = z.infer<typeof frameForThoughtSchema>;

export function validateFrameForThought(frameInput: unknown, graphInput: unknown): FrameForThought {
  const frame = frameForThoughtSchema.parse(frameInput);
  const graph = validateResearchGraph(graphInput);
  if (frame.graphSnapshotId !== graph.snapshotId || frame.datasetId !== graph.datasetId) {
    throw new Error("FRAME_GRAPH_MISMATCH");
  }
  const refs = new Set(graph.nodes.flatMap((node) => node.evidenceRefs).concat(
    graph.edges.flatMap((edge) => edge.provenanceRefs)
  ));
  for (const ref of [...frame.supportingEvidenceRefs, ...frame.contradictingEvidenceRefs]) {
    if (!refs.has(ref)) throw new Error("FRAME_EVIDENCE_NOT_IN_GRAPH");
  }
  return frame;
}

export function frameRequiresHumanReview(_frame: FrameForThought): true {
  return true;
}
