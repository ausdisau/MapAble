/**
 * Local-first processing broker contracts for Companion and equivalent web paths.
 * Essential services must remain available without AI-capable devices.
 */

export const PROCESSING_MODES = [
  "deterministic_local",
  "on_device_model",
  "privacy_disclosed_cloud",
  "human_assistance",
] as const;

export type ProcessingMode = (typeof PROCESSING_MODES)[number];

export type DeviceCapabilitySnapshot = {
  hasOnDeviceModelRuntime: boolean;
  osSupportsOnDeviceAi: boolean;
  modelAvailable: boolean;
  networkAvailable: boolean;
  batteryPercent: number | null;
  /** Participant prefers local / minimal cloud. */
  preferLocalProcessing: boolean;
  dataSensitivity: "public" | "operational" | "participant_pii" | "health_sensitive";
  consentAllowsCloud: boolean;
  accessibilityPreferDeterministic: boolean;
};

export type EdgeCapabilityKey =
  | "edge.visit_pack_summary"
  | "edge.what_changed_explain"
  | "edge.plain_language_rewrite"
  | "edge.aac_phrase_shorten"
  | "edge.image_description_candidate"
  | "edge.appointment_date_extract"
  | "edge.approved_content_translate"
  | "edge.status_label_explain"
  | "edge.structured_draft_prepare";

export type ProcessingReceipt = {
  id: string;
  capability: EdgeCapabilityKey;
  processingMode: ProcessingMode;
  model: string | null;
  modelVersion: string | null;
  dataUsed: string[];
  dataLeftDevice: boolean;
  retention: string;
  consentBasis: string;
  outputStatus: "ok" | "fallback" | "abstain" | "human_required" | "disabled";
  humanReviewRequired: boolean;
  createdAtIso: string;
  authorityCeiling: "READ_ONLY_EXPLAIN" | "DRAFT_ONLY";
  publicAppStoreClaim: false;
};

export type EdgeBrokerResult<T> = {
  value: T | null;
  receipt: ProcessingReceipt;
  equivalentNonAiPathAvailable: true;
};
