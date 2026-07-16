import type { ApplicationPreflightResult } from "@/lib/programmes/contracts/application-preflight-service";
import type { DocumentChecklistItem } from "@/lib/programmes/contracts/document-checklist-service";
import type { ProgrammeExportPack } from "@/lib/programmes/contracts/programme-export-service";
import type { ProgrammeReferralDraft } from "@/lib/programmes/contracts/programme-referral-service";
import type { ProgrammeOutcomeRecord } from "@/lib/programmes/contracts/programme-outcome-service";
import type { EvidenceAttachmentView } from "@/lib/programmes/contracts/evidence-attachment-service";

import { validateAuraProposalBoundary } from "@/lib/programmes/safety-invariants";

const referralStore = new Map<string, ProgrammeReferralDraft>();
const outcomeStore = new Map<string, ProgrammeOutcomeRecord>();
const evidenceStore = new Map<string, EvidenceAttachmentView>();

export async function buildDocumentChecklist(input: {
  programmeId: string;
  pathwayId?: string;
  jurisdiction?: string;
}): Promise<DocumentChecklistItem[]> {
  return [
    {
      id: "identity",
      label: "Proof of identity",
      required: true,
      status: "required",
    },
    {
      id: "consent",
      label: "Consent to share information",
      required: true,
      status: "required",
    },
    {
      id: "supporting_evidence",
      label: "Supporting evidence (if available)",
      required: false,
      status: "unknown",
    },
    {
      id: "pathway_specific",
      label: `${input.programmeId} pathway documents`,
      required: false,
      status: input.pathwayId ? "required" : "unknown",
    },
  ];
}

export async function runApplicationPreflight(input: {
  programmeId: string;
  participantId: string;
  applicationType: string;
  payload: Record<string, unknown>;
}): Promise<ApplicationPreflightResult> {
  validateAuraProposalBoundary({ action: "explain" });

  const findings = [];

  if (input.payload.eligibilityClaim) {
    findings.push({
      code: "eligibility_requires_human",
      severity: "requires_human" as const,
      message:
        "Eligibility must be decided by an authorised external body — not MapAble",
    });
  }

  if (!input.payload.documentsProvided) {
    findings.push({
      code: "documents_incomplete",
      severity: "warning" as const,
      message: "Some required documents are not yet attached",
    });
  }

  return {
    canProceed: !findings.some((f) => f.severity === "requires_human"),
    findings,
    requiresHumanDecision: findings.some(
      (f) => f.severity === "requires_human",
    ),
  };
}

export async function createReferralDraft(input: {
  participantId: string;
  missionId?: string;
  recipientOrganisation: string;
  purpose: string;
  sharedFields: string[];
  createdById: string;
}): Promise<ProgrammeReferralDraft> {
  const draft: ProgrammeReferralDraft = {
    id: `referral-${Date.now()}`,
    recipientOrganisation: input.recipientOrganisation,
    purpose: input.purpose,
    sharedFields: input.sharedFields,
    status: "draft",
    requiresParticipantApproval: true,
  };
  referralStore.set(draft.id, draft);
  return draft;
}

export async function approveReferralDraft(input: {
  referralId: string;
  participantId: string;
}): Promise<ProgrammeReferralDraft> {
  const draft = referralStore.get(input.referralId);
  if (!draft) {
    throw new Error("Referral draft not found");
  }
  const sent: ProgrammeReferralDraft = { ...draft, status: "sent" };
  referralStore.set(input.referralId, sent);
  return sent;
}

export async function recordProgrammeOutcome(input: {
  programmeId: string;
  participantId: string;
  missionId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  recordedById: string;
  correlationId: string;
}): Promise<ProgrammeOutcomeRecord> {
  const outcome: ProgrammeOutcomeRecord = {
    id: `outcome-${Date.now()}`,
    programmeId: input.programmeId,
    missionId: input.missionId,
    participantId: input.participantId,
    summary: input.summary,
    recordedAt: new Date(),
    metadata: input.metadata,
  };
  outcomeStore.set(outcome.id, outcome);
  return outcome;
}

export async function attachProgrammeEvidence(input: {
  participantId: string;
  missionId?: string;
  caseId?: string;
  title: string;
  sourceRecordId?: string;
  documentId?: string;
  provenance: string;
  createdById: string;
  correlationId: string;
}): Promise<EvidenceAttachmentView> {
  const attachment: EvidenceAttachmentView = {
    id: `evidence-${Date.now()}`,
    title: input.title,
    provenance: input.provenance,
    sourceRecordId: input.sourceRecordId,
    documentId: input.documentId,
    attachedAt: new Date(),
  };
  evidenceStore.set(attachment.id, attachment);
  return attachment;
}

export async function listProgrammeEvidence(input: {
  missionId?: string;
  caseId?: string;
}): Promise<EvidenceAttachmentView[]> {
  void input;
  return Array.from(evidenceStore.values());
}

export async function generateProgrammeExportPack(input: {
  programmeId: string;
  participantId: string;
  missionId?: string;
}): Promise<ProgrammeExportPack> {
  return {
    title: `${input.programmeId} offline pack`,
    generatedAt: new Date(),
    sections: [
      {
        title: "Your goals",
        body: "Participant-controlled summary of current goals and next actions.",
        isUnknown: !input.missionId,
      },
      {
        title: "Known information",
        body: "Verified sources and dates are listed separately from unknowns.",
      },
      {
        title: "Human contacts",
        body: "Non-AI escalation routes remain available.",
      },
    ],
    nonAiContacts: [
      "MapAble support: /dashboard/safety/support",
      "Incident reporting: /dashboard/safety/incidents/new",
    ],
  };
}

export const documentChecklistService = {
  buildChecklist: buildDocumentChecklist,
};
export const applicationPreflightService = {
  runPreflight: runApplicationPreflight,
};
export const programmeReferralService = {
  createDraft: createReferralDraft,
  approveAndSend: approveReferralDraft,
};
export const programmeOutcomeService = {
  recordOutcome: recordProgrammeOutcome,
};
export const evidenceAttachmentService = {
  attachEvidence: attachProgrammeEvidence,
  listEvidence: listProgrammeEvidence,
};
export const programmeExportService = {
  generateOfflinePack: generateProgrammeExportPack,
};

/** Test helper */
export function resetProgrammeFoundationStoresForTests(): void {
  referralStore.clear();
  outcomeStore.clear();
  evidenceStore.clear();
}
