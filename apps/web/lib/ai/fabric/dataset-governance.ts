/**
 * Research-only dataset governance. Records source lineage and permitted uses,
 * not unconsented training authority. No live dataset connector is created here.
 */
import { z } from "zod";
import { getAiPolicySource } from "./policy-source-register";

export const governedDatasetSchema = z.strictObject({
  datasetId: z.string().regex(/^[a-z0-9][a-z0-9_.-]{2,80}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  revisionDigest: z.string().regex(/^[a-f0-9]{64}$/),
  recordKind: z.enum(["synthetic_graph", "policy_source_index"]),
  provenanceIds: z.array(z.string()).max(100),
  allowedPurposes: z.array(z.enum([
    "schema_validation", "synthetic_graph_eval", "policy_comparison", "multimodal_eval"
  ])).min(1),
  approval: z.enum(["synthetic_test", "research_index_only", "suspended"]),
  privacyClass: z.enum(["synthetic", "public_metadata"]),
  licenceStatus: z.enum(["synthetic_owned", "source_link_only_unverified"]),
  dataRegion: z.enum(["none_no_storage", "australia_only"]),
  trainingAllowed: z.boolean(),
  ingestionEnabled: z.literal(false),
  requiresHumanReview: z.literal(true)
});

export type GovernedDataset = z.infer<typeof governedDatasetSchema>;
export type DatasetPurpose = GovernedDataset["allowedPurposes"][number];

export const GOVERNED_DATASETS: readonly GovernedDataset[] = [
  {
    datasetId: "mapable-synthetic-graph-v1",
    version: "1.0.0", revisionDigest: "1".repeat(64),
    recordKind: "synthetic_graph", provenanceIds: [],
    allowedPurposes: ["schema_validation", "synthetic_graph_eval", "multimodal_eval"],
    approval: "synthetic_test", privacyClass: "synthetic",
    licenceStatus: "synthetic_owned", dataRegion: "none_no_storage",
    trainingAllowed: false, ingestionEnabled: false, requiresHumanReview: true
  },
  {
    datasetId: "national-ai-strategies-source-index-v1",
    version: "1.0.0", revisionDigest: "2".repeat(64),
    recordKind: "policy_source_index",
    provenanceIds: [
      "ginc-national-ai-strategies",
      "ginc-80-strategies-2026",
      "au-national-ai-plan-2025",
      "au-pmc-ai-cyber-review-2026",
      "us-eo-14434-2026"
    ],
    allowedPurposes: ["schema_validation", "policy_comparison"],
    approval: "research_index_only", privacyClass: "public_metadata",
    licenceStatus: "source_link_only_unverified", dataRegion: "none_no_storage",
    trainingAllowed: false, ingestionEnabled: false, requiresHumanReview: true
  }
] as const;

/** Labels and link metadata are not proof of dataset licence or training consent. */
export function requireDatasetPurpose(input: {
  datasetId: string;
  purpose: DatasetPurpose;
  trainingRequested: boolean;
  containsPersonData: boolean;
}): GovernedDataset {
  const dataset = GOVERNED_DATASETS.find((d) => d.datasetId === input.datasetId);
  if (!dataset || dataset.approval === "suspended") throw new Error("DATASET_UNAVAILABLE");
  governedDatasetSchema.parse(dataset);
  if (input.containsPersonData) throw new Error("PERSON_DATA_NOT_PERMITTED");
  if (!dataset.allowedPurposes.includes(input.purpose)) throw new Error("PURPOSE_NOT_ALLOWED");
  if (input.trainingRequested && !dataset.trainingAllowed) throw new Error("TRAINING_NOT_AUTHORISED");
  if (dataset.provenanceIds.some((id) => !getAiPolicySource(id))) {
    throw new Error("UNREGISTERED_SOURCE");
  }
  return dataset;
}

export const datasetStreamEventSchema = z.strictObject({
  schemaVersion: z.literal(1),
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  datasetId: z.string().min(3),
  datasetVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  purpose: z.enum([
    "schema_validation", "synthetic_graph_eval", "policy_comparison", "multimodal_eval"
  ]),
  kind: z.enum([
    "source_indexed", "modality_descriptor_registered", "graph_projected",
    "frame_proposed", "evaluation_recorded", "dataset_suspended"
  ]),
  /** A content-derived public metadata checksum, not a user or tenant identifier. */
  artifactDigest: z.string().regex(/^[a-f0-9]{64}$/),
  sourceRefs: z.array(z.string()).max(30),
  environment: z.literal("synthetic"),
  actionAuthority: z.literal("none"),
  containsRawMedia: z.literal(false),
  containsPersonData: z.literal(false)
});

export type DatasetStreamEvent = z.infer<typeof datasetStreamEventSchema>;

export function validateDatasetStreamEvent(input: unknown): DatasetStreamEvent {
  const event = datasetStreamEventSchema.parse(input);
  const dataset = requireDatasetPurpose({
    datasetId: event.datasetId,
    purpose: event.purpose,
    trainingRequested: false,
    containsPersonData: event.containsPersonData
  });
  if (event.datasetVersion !== dataset.version) throw new Error("DATASET_VERSION_MISMATCH");
  if (event.sourceRefs.some((ref) => !dataset.provenanceIds.includes(ref))) {
    throw new Error("SOURCE_NOT_IN_DATASET");
  }
  return event;
}
