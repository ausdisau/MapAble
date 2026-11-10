import { describe, expect, it } from "vitest";

import {
  AI_POLICY_SOURCES,
  getAiPolicySource,
  maySupportPrimaryLegalClaim,
  validatePolicySourceRegister
} from "@/lib/ai/fabric/policy-source-register";
import {
  GOVERNED_DATASETS, requireDatasetPurpose,
  validateDatasetStreamEvent
} from "@/lib/ai/fabric/dataset-governance";
import {
  SYNTHETIC_GRAPH_FIXTURE,
  runUntrainedGraphBaseline,
  validateResearchGraph
} from "@/lib/ai/fabric/graph-harness";
import {
  prepareMultimodalResearchJob
} from "@/lib/ai/fabric/multimodal-harness";
import {
  frameRequiresHumanReview, validateFrameForThought
} from "@/lib/ai/fabric/frame-for-thought";

const goodFrame = () => ({
  frameId: "9e6bad01-9b2b-46ae-9cbb-35fd6ec2f02b",
  schemaVersion: "1.0.0" as const,
  graphSnapshotId: SYNTHETIC_GRAPH_FIXTURE.snapshotId,
  datasetId: "mapable-synthetic-graph-v1" as const,
  createdAt: "2026-11-10T12:00:00.000Z",
  questionSummary: "Is the fictional venue route confirmed?",
  evidenceSummary: "The fictional access graph includes an unverified lift.",
  proposedInterpretation: "Ask for current lift status before planning the route.",
  supportingEvidenceRefs: ["ev:fixture-place"],
  contradictingEvidenceRefs: ["ev:fixture-lift"],
  unknowns: ["Current lift operation is not known"],
  alternativeExplanations: ["The lift may be operational but lacks recent evidence"],
  modalityDescriptorRefs: [],
  reviewStatus: "human_review_required" as const,
  regulatoryEffect: "none" as const,
  actionAuthority: "none" as const,
  publishAsVerified: false as const,
  sourceIsSynthetic: true as const
});

describe("AI policy source provenance", () => {
  it("keeps primary government documents separate from GINC analysis", () => {
    validatePolicySourceRegister();
    expect(AI_POLICY_SOURCES.length).toBeGreaterThanOrEqual(4);
    expect(getAiPolicySource("ginc-national-ai-strategies")?.evidenceTier).toBe("secondary_research");
    expect(maySupportPrimaryLegalClaim(getAiPolicySource("ginc-national-ai-strategies")!)).toBe(false);
    expect(maySupportPrimaryLegalClaim(getAiPolicySource("au-pmc-ai-cyber-review-2026")!)).toBe(false);
    expect(getAiPolicySource("us-eo-14434-2026")?.jurisdiction).toBe("US");
  });
});

describe("dataset-governed stream", () => {
  it("keeps external research sources as links with training off", () => {
    expect(GOVERNED_DATASETS.every((d) => d.trainingAllowed === false)).toBe(true);
    expect(() => requireDatasetPurpose({
      datasetId: "national-ai-strategies-source-index-v1",
      purpose: "policy_comparison", trainingRequested: true, containsPersonData: false
    })).toThrow("TRAINING_NOT_AUTHORISED");
  });

  it("denies person-data use even for a synthetic training fixture", () => {
    expect(() => requireDatasetPurpose({
      datasetId: "mapable-synthetic-graph-v1",
      purpose: "synthetic_graph_eval", trainingRequested: false, containsPersonData: true
    })).toThrow("PERSON_DATA_NOT_PERMITTED");
  });

  it("requires explicit provenance in policy index events", () => {
    const good = {
      schemaVersion: 1, eventId: "4e9d4770-3619-4d26-a6d9-0a30efdd9d6d",
      occurredAt: "2026-11-10T12:00:00.000Z",
      datasetId: "national-ai-strategies-source-index-v1",
      datasetVersion: "1.0.0", purpose: "policy_comparison" as const,
      kind: "source_indexed" as const,
      artifactDigest: "a".repeat(64), sourceRefs: ["ginc-national-ai-strategies"],
      environment: "synthetic" as const, actionAuthority: "none" as const,
      containsRawMedia: false as const, containsPersonData: false as const
    };
    expect(validateDatasetStreamEvent(good).sourceRefs).toEqual(["ginc-national-ai-strategies"]);
    expect(() => validateDatasetStreamEvent({ ...good, sourceRefs: ["unknown-source"] })).toThrow("SOURCE_NOT_IN_DATASET");
    expect(() => validateDatasetStreamEvent({ ...good, rawMedia: "secret" })).toThrow();
    expect(() => validateDatasetStreamEvent({ ...good, actionAuthority: "execute" })).toThrow();
  });
});

describe("synthetic GNN structural harness", () => {
  it("validates graph and produces deterministic untrained neighbor mean", () => {
    const graph = validateResearchGraph(SYNTHETIC_GRAPH_FIXTURE);
    expect(graph.nodes).toHaveLength(3);
    const first = runUntrainedGraphBaseline(graph).embeddings[0];
    expect(first.nodeId).toBe("place:fictional");
    expect(first.values[0]).toBeCloseTo(1 / 3);
    expect(first.values[1]).toBeCloseTo(1 / 3);
    expect(runUntrainedGraphBaseline(graph).learningPerformed).toBe(false);
  });

  it("rejects dangling edges and non-synthetic data", () => {
    expect(() => validateResearchGraph({
      ...SYNTHETIC_GRAPH_FIXTURE,
      edges: [{ from: "place:fictional", to: "unknown:node", relation: "connects_to", provenanceRefs: [] }]
    })).toThrow("DANGLING_GRAPH_EDGE");
    expect(() => validateResearchGraph({
      ...SYNTHETIC_GRAPH_FIXTURE, publishedAsVerified: true
    })).toThrow();
  });
});

describe("multimodal transformer and thought-frame gates", () => {
  it("represents AAC input as a descriptor, not raw speech or a capacity label", () => {
    const job = prepareMultimodalResearchJob({
      requestId: "df4ac59f-287d-47ca-934f-cb75a63b461a",
      datasetId: "mapable-synthetic-graph-v1",
      modalityDescriptors: [{
        descriptorId: "mod:aac-fixture", datasetId: "mapable-synthetic-graph-v1",
        modality: "aac", fixtureRef: "fixture:aac/utterance",
        contentDigest: "c".repeat(64),
        accessibilityEquivalent: "Synthetic participant statement represented by a plain-language text alternative",
        provenanceRefs: ["ev:fixture-place"],
        isSynthetic: true, hasRawContent: false,
        personIdentificationRequested: false, affectOrCapacityInferenceRequested: false
      }],
      purpose: "multimodal_eval", mode: "synthetic", actionAuthority: "none",
      modelOutputMayWriteRecords: false
    });
    expect(job.modelExecutionEnabled).toBe(false);
    expect(job.requiresHumanReview).toBe(true);
  });

  it("requires explicit evidence for external explanations and human review", () => {
    const frame = validateFrameForThought(goodFrame(), SYNTHETIC_GRAPH_FIXTURE);
    expect(frameRequiresHumanReview(frame)).toBe(true);
    expect(frame.regulatoryEffect).toBe("none");
    expect(() => validateFrameForThought({
      ...goodFrame(), supportingEvidenceRefs: ["ev:invented"]
    }, SYNTHETIC_GRAPH_FIXTURE)).toThrow("FRAME_EVIDENCE_NOT_IN_GRAPH");
    expect(() => validateFrameForThought({
      ...goodFrame(), publishAsVerified: true
    }, SYNTHETIC_GRAPH_FIXTURE)).toThrow();
  });
});
