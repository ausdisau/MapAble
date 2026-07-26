export const DATA_CLASSES = [
  "public",
  "operational",
  "participant_pii",
  "health_sensitive",
  "financial",
  "safeguarding",
  "credentials_secrets",
  "legal_privileged",
] as const;

export type DataClass = (typeof DATA_CLASSES)[number];

export const OUTPUT_PROVENANCE = [
  "confirmed_fact",
  "participant_report",
  "provider_report",
  "worker_note",
  "system_record",
  "model_inference",
  "unresolved_conflict",
  "missing_information",
  "stale_information",
  "disputed_information",
] as const;

export type OutputProvenance = (typeof OUTPUT_PROVENANCE)[number];
