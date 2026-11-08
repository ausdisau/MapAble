/**
 * Explicitly fictitious read-only development records. Do not connect to real
 * participant files, provider imports or production retrieval in this phase.
 */
import {
  CARE_RAG_PURPOSE,
  type CareRagEvidence,
  type CareRagStore,
} from "./care-support-rag";

const privateExample: CareRagEvidence = {
  id: "synthetic-evidence-001",
  participantId: "synthetic-participant-001",
  tenantId: "synthetic-tenant-001",
  purpose: CARE_RAG_PURPOSE,
  visibility: "participant_private",
  synthetic: true,
  redactedText: "I prefer text messages. I need help opening breakfast packaging, not eating.",
  sourceRef: "synthetic-statement-001",
  sourceVersion: "1",
  evidenceStatus: "synthetic",
  expiresAtIso: null,
};

const publicExample: CareRagEvidence = {
  id: "synthetic-provider-001",
  participantId: null,
  tenantId: null,
  purpose: "provider_directory_explain",
  visibility: "public_provider",
  synthetic: true,
  redactedText: "Example Support Co provides fictional personal care and text-first coordination. Competence and availability are unverified.",
  sourceRef: "synthetic-directory-001",
  sourceVersion: "1",
  evidenceStatus: "synthetic",
  expiresAtIso: null,
};

export function createSyntheticCareRagStore(): CareRagStore {
  return {
    async loadParticipantEvidence(scope) {
      return [privateExample].filter(
        (e) => e.participantId === scope.participantId &&
          e.tenantId === scope.tenantId &&
          e.purpose === scope.purpose,
      );
    },
    async loadPublicProviderEvidence() {
      return [publicExample];
    },
  };
}
