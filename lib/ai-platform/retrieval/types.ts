export type SemanticEvidenceChunk = {
  id: string;
  sourceRecordType: string;
  sourceRecordId: string;
  sourceVersion: string;
  chunkText: string;
  /** Prefer redacted text for any model path; never log raw PII in telemetry. */
  redactedText: string;
  embeddingModel: string | null;
  embeddingVersion: string | null;
  tenantId: string;
  participantScopeId: string | null;
  purpose: string;
  expiryIso: string | null;
  conflictState: "none" | "conflict" | "stale" | "unknown";
  sourceReliabilityClass: "canonical" | "projection" | "synthetic" | "candidate";
};

export type RetrievalCitation = {
  recordType: string;
  recordId: string;
  version: string;
  label: string;
};

export type HybridRetrievalHit = {
  chunkId: string;
  score: number;
  strategy: "keyword" | "graph" | "embedding";
  citation: RetrievalCitation;
  text: string;
};

export type HybridRetrievalResult = {
  query: string;
  missionKey: string;
  hits: HybridRetrievalHit[];
  embeddingsUsed: boolean;
  filteredBeforeRank: true;
  unknowns: string[];
};
