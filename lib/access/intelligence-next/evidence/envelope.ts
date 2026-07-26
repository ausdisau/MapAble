import type { AccessEvidenceClass } from "./classes";

export type AccessEvidenceReference = {
  evidenceId: string;
  class: AccessEvidenceClass;
  ontologyConceptId?: string;
  source: string;
  sourceVersion?: string;
  observedAt: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  summary: string;
  limitations: string[];
};

export type AccessEvidenceEnvelope = {
  envelopeId: string;
  subjectCanonicalRef: string;
  references: AccessEvidenceReference[];
  conflicts: Array<{
    conceptId: string;
    leftEvidenceId: string;
    rightEvidenceId: string;
    note: string;
  }>;
  createdAt: string;
};

export function createEvidenceEnvelope(input: {
  envelopeId: string;
  subjectCanonicalRef: string;
  references: AccessEvidenceReference[];
  conflicts?: AccessEvidenceEnvelope["conflicts"];
  createdAt?: string;
}): AccessEvidenceEnvelope {
  return {
    envelopeId: input.envelopeId,
    subjectCanonicalRef: input.subjectCanonicalRef,
    references: input.references,
    conflicts: input.conflicts ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
