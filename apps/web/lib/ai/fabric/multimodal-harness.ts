/**
 * Multimodal transformer *input descriptor* adapter. No media bytes, URLs,
 * model inference, participant data, embeddings or arbitrary plugin execution.
 * All model calls remain disabled until a separate worker is reviewed.
 */
import { z } from "zod";
import { requireDatasetPurpose } from "./dataset-governance";

export const modalityDescriptorSchema = z.strictObject({
  descriptorId: z.string().regex(/^[a-z0-9_.:-]{3,100}$/),
  datasetId: z.literal("mapable-synthetic-graph-v1"),
  modality: z.enum(["text", "aac", "image", "audio", "video", "document"]),
  /** Local synthetic fixture reference, not a filename or network URL. */
  fixtureRef: z.string().regex(/^fixture:[a-z0-9_./:-]{3,120}$/),
  contentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  accessibilityEquivalent: z.string().trim().min(5).max(240),
  provenanceRefs: z.array(z.string().min(3)).max(20),
  isSynthetic: z.literal(true),
  hasRawContent: z.literal(false),
  personIdentificationRequested: z.literal(false),
  affectOrCapacityInferenceRequested: z.literal(false)
});

export type ModalityDescriptor = z.infer<typeof modalityDescriptorSchema>;

export const multimodalResearchRequestSchema = z.strictObject({
  requestId: z.string().uuid(),
  datasetId: z.literal("mapable-synthetic-graph-v1"),
  modalityDescriptors: z.array(modalityDescriptorSchema).min(1).max(12),
  purpose: z.literal("multimodal_eval"),
  mode: z.literal("synthetic"),
  actionAuthority: z.literal("none"),
  modelOutputMayWriteRecords: z.literal(false)
});

export type MultimodalResearchRequest = z.infer<typeof multimodalResearchRequestSchema>;
export type PreparedMultimodalJob = {
  requestId: string;
  datasetId: string;
  descriptorIds: string[];
  modelExecutionEnabled: false;
  requiresHumanReview: true;
  actionAuthority: "none";
};

/**
 * Preprocessing contract only. The transformer worker must fetch actual media
 * through its *own* authenticated, consent-bound adapter (none is provided).
 */
export function prepareMultimodalResearchJob(raw: unknown): PreparedMultimodalJob {
  const request = multimodalResearchRequestSchema.parse(raw);
  requireDatasetPurpose({
    datasetId: request.datasetId, purpose: request.purpose,
    trainingRequested: false, containsPersonData: false
  });
  const descriptors = request.modalityDescriptors;
  if (new Set(descriptors.map((d) => d.descriptorId)).size !== descriptors.length) {
    throw new Error("DUPLICATE_MODALITY_DESCRIPTOR");
  }
  return {
    requestId: request.requestId,
    datasetId: request.datasetId,
    descriptorIds: descriptors.map((d) => d.descriptorId),
    modelExecutionEnabled: false, requiresHumanReview: true, actionAuthority: "none"
  };
}

export interface MultimodalTransformerWorker {
  readonly modelCardRef: string;
  readonly modelVersion: string;
  /**
   * Only an independently audited worker may implement this method.
   * The control plane does not instantiate or invoke it.
   */
  evaluateSyntheticJob(job: PreparedMultimodalJob): Promise<{
    readonly candidateArtifactRef: string;
    readonly provenanceRefs: readonly string[];
    readonly uncertaintyCodes: readonly string[];
    readonly actionAuthority: "none";
  }>;
}
