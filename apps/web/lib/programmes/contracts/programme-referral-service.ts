export interface ProgrammeReferralDraft {
  id: string;
  recipientOrganisation: string;
  purpose: string;
  sharedFields: string[];
  status: "draft" | "pending_approval" | "sent";
  requiresParticipantApproval: true;
}

export interface ProgrammeReferralService {
  createDraft(input: {
    participantId: string;
    missionId?: string;
    recipientOrganisation: string;
    purpose: string;
    sharedFields: string[];
    createdById: string;
  }): Promise<ProgrammeReferralDraft>;
  approveAndSend(input: {
    referralId: string;
    participantId: string;
  }): Promise<ProgrammeReferralDraft>;
}
