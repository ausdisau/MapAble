/**
 * Embedding contracts only — no store, no live vectors in this wave.
 * When enabled later, every chunk must support delete-on-consent-revoke.
 */

export type EmbeddingRecord = {
  chunkId: string;
  model: string;
  version: string;
  tenantId: string;
  participantScopeId: string | null;
  purpose: string;
  vector: number[] | null;
  createdAtIso: string;
  deletedAtIso: string | null;
};

export type EmbeddingDeleteRequest = {
  tenantId: string;
  participantScopeId: string | null;
  reason: "consent_revoked" | "source_deleted" | "retention_expiry";
};
