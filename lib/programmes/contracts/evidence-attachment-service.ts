export interface EvidenceAttachmentInput {
  participantId: string;
  missionId?: string;
  caseId?: string;
  title: string;
  sourceRecordId?: string;
  documentId?: string;
  provenance: string;
  createdById: string;
  correlationId: string;
}

export interface EvidenceAttachmentView {
  id: string;
  title: string;
  provenance: string;
  sourceRecordId?: string;
  documentId?: string;
  attachedAt: Date;
}

export interface EvidenceAttachmentService {
  attachEvidence(
    input: EvidenceAttachmentInput,
  ): Promise<EvidenceAttachmentView>;
  listEvidence(input: {
    missionId?: string;
    caseId?: string;
  }): Promise<EvidenceAttachmentView[]>;
}
